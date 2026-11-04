using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace DualRead.Controllers;

[ApiController]
[Route("api/translate")]
public class QuickTranslateController : ControllerBase
{
    private const int MaxTextLength = 8000;
    private const string GoogleSingleUrl = "https://translate.googleapis.com/translate_a/single";
    private const string UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    private readonly IMemoryCache _cache;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<QuickTranslateController> _logger;

    public QuickTranslateController(IMemoryCache cache, IHttpClientFactory httpClientFactory, ILogger<QuickTranslateController> logger)
    {
        _cache = cache;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpGet]
    [HttpPost]
    public async Task<IActionResult> Translate([FromQuery] string? text, [FromQuery] string sl = "auto", [FromQuery] string tl = "vi", [FromBody] TranslateRequestDto? bodyDto = null)
    {
        var inputText = text ?? bodyDto?.Text;
        if (string.IsNullOrWhiteSpace(inputText))
        {
            return BadRequest(new { error = "Text to translate is required." });
        }

        var trimmed = inputText.Trim();
        if (trimmed.Length > MaxTextLength)
        {
            trimmed = trimmed[..MaxTextLength];
        }

        var cacheKey = $"trans:{sl}:{tl}:{trimmed.ToLowerInvariant()}";
        if (_cache.TryGetValue(cacheKey, out QuickTranslateResult? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var result = await TranslateWithFallbacksAsync(trimmed, sl, tl);
        if (result is null)
        {
            return StatusCode(502, new { error = "Translation service temporarily unavailable." });
        }

        _cache.Set(cacheKey, result, TimeSpan.FromHours(24));
        return Ok(result);
    }

    private async Task<QuickTranslateResult?> TranslateWithFallbacksAsync(string text, string sl, string tl)
    {
        var client = CreateHttpClient();
        var wantsDictionary = text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length <= 2;

        var attempts = new List<Func<Task<QuickTranslateResult?>>>
        {
            () => TranslateWithPostAsync(client, text, sl, tl, wantsDictionary),
            () => TranslateWithGetAsync(client, text, sl, tl, wantsDictionary),
            () => TranslateWithBackupEndpointAsync(client, text, sl, tl),
            () => TranslateWithMyMemoryAsync(client, text, sl, tl)
        };

        foreach (var attempt in attempts)
        {
            try
            {
                var result = await attempt();
                if (result is not null)
                {
                    return result;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "A translation attempt failed, trying the next one.");
            }
        }

        return null;
    }

    private HttpClient CreateHttpClient()
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("User-Agent", UserAgent);
        return client;
    }

    private async Task<QuickTranslateResult?> TranslateWithPostAsync(HttpClient client, string text, string sl, string tl, bool wantsDictionary)
    {
        var form = new List<KeyValuePair<string, string>>
        {
            new("client", "gtx"),
            new("sl", sl),
            new("tl", tl),
            new("dt", "t"),
            new("q", text)
        };

        if (wantsDictionary)
        {
            form.Add(new("dt", "bd"));
        }

        var response = await client.PostAsync(GoogleSingleUrl, new FormUrlEncodedContent(form));
        return ParseUsableResult(await ReadBodyAsync(response, "Google Translate POST"), text);
    }

    private async Task<QuickTranslateResult?> TranslateWithGetAsync(HttpClient client, string text, string sl, string tl, bool wantsDictionary)
    {
        var dictionaryPart = wantsDictionary ? "&dt=bd" : string.Empty;
        var url = $"{GoogleSingleUrl}?client=gtx&sl={sl}&tl={tl}&dt=t{dictionaryPart}&q={Uri.EscapeDataString(text)}";

        var response = await client.GetAsync(url);
        return ParseUsableResult(await ReadBodyAsync(response, "Google Translate GET"), text);
    }

    private async Task<QuickTranslateResult?> TranslateWithBackupEndpointAsync(HttpClient client, string text, string sl, string tl)
    {
        var url = $"https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl={sl}&tl={tl}&q={Uri.EscapeDataString(text)}";

        var response = await client.GetAsync(url);
        var json = await ReadBodyAsync(response, "Google Translate backup");
        if (json is null)
        {
            return null;
        }

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        if (root.ValueKind != JsonValueKind.Array || root.GetArrayLength() == 0)
        {
            return null;
        }

        var translated = ExtractTranslatedFragment(root[0]);
        if (string.IsNullOrWhiteSpace(translated))
        {
            return null;
        }

        return new QuickTranslateResult { OriginalText = text, TranslatedText = translated };
    }

    private async Task<QuickTranslateResult?> TranslateWithMyMemoryAsync(HttpClient client, string text, string sl, string tl)
    {
        var sourceLanguage = sl == "auto" ? "en" : sl;
        var url = $"https://api.mymemory.translated.net/get?q={Uri.EscapeDataString(text)}&langpair={Uri.EscapeDataString(sourceLanguage + "|" + tl)}";

        var response = await client.GetAsync(url);
        var json = await ReadBodyAsync(response, "MyMemory");
        if (json is null)
        {
            return null;
        }

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        if (root.ValueKind != JsonValueKind.Object
            || !root.TryGetProperty("responseStatus", out var responseStatus)
            || responseStatus.ValueKind != JsonValueKind.Number
            || responseStatus.GetInt32() != 200
            || !root.TryGetProperty("responseData", out var responseData)
            || responseData.ValueKind != JsonValueKind.Object
            || !responseData.TryGetProperty("translatedText", out var translatedTextElement))
        {
            return null;
        }

        if (translatedTextElement.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        var translatedText = translatedTextElement.GetString();
        if (string.IsNullOrWhiteSpace(translatedText))
        {
            return null;
        }

        return new QuickTranslateResult
        {
            OriginalText = text,
            TranslatedText = System.Net.WebUtility.HtmlDecode(translatedText)
        };
    }

    private async Task<string?> ReadBodyAsync(HttpResponseMessage response, string provider)
    {
        if (!response.IsSuccessStatusCode)
        {
            var snippet = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("{TranslationProvider} returned HTTP {StatusCode}: {Body}", provider, (int)response.StatusCode, snippet.Length > 200 ? snippet[..200] : snippet);
            return null;
        }

        return await response.Content.ReadAsStringAsync();
    }

    private static QuickTranslateResult? ParseUsableResult(string? json, string original)
    {
        if (json is null)
        {
            return null;
        }

        var parsed = ParseGoogleTranslateJson(json, original);
        return parsed is not null && !string.IsNullOrWhiteSpace(parsed.TranslatedText) ? parsed : null;
    }

    private static QuickTranslateResult? ParseGoogleTranslateJson(string json, string original)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var translated = ReadTranslatedText(doc.RootElement);

            return new QuickTranslateResult
            {
                OriginalText = original,
                TranslatedText = string.IsNullOrEmpty(translated) ? original : translated,
                Dict = ReadDictionary(doc.RootElement)
            };
        }
        catch
        {
            return null;
        }
    }

    private static string ReadTranslatedText(JsonElement root)
    {
        var fragments = new List<string>();

        foreach (var sentence in ChildrenAt(root, 0))
        {
            if (sentence.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            var translated = ExtractTranslatedFragment(sentence);
            if (!string.IsNullOrWhiteSpace(translated))
            {
                fragments.Add(translated.Trim());
            }
        }

        return string.Join(" ", fragments).Trim();
    }

    private static string? ExtractTranslatedFragment(JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.String)
        {
            var text = element.GetString();
            return string.IsNullOrWhiteSpace(text) ? null : text;
        }

        if (element.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        foreach (var child in element.EnumerateArray())
        {
            var translated = ExtractTranslatedFragment(child);
            if (!string.IsNullOrWhiteSpace(translated))
            {
                return translated;
            }
        }

        return null;
    }

    private static List<DictionaryEntry> ReadDictionary(JsonElement root)
    {
        var entries = new List<DictionaryEntry>();

        foreach (var group in ChildrenAt(root, 1))
        {
            if (group.ValueKind != JsonValueKind.Array || group.GetArrayLength() < 2)
            {
                continue;
            }

            var pos = group[0].GetString() ?? string.Empty;
            var terms = ChildrenAt(group, 1)
                .Select(term => term.GetString())
                .OfType<string>()
                .Where(term => term.Length > 0)
                .Take(5)
                .ToList();

            if (pos.Length > 0 && terms.Count > 0)
            {
                entries.Add(new DictionaryEntry { Pos = pos, Terms = terms });
            }
        }

        return entries;
    }

    private static IEnumerable<JsonElement> ChildrenAt(JsonElement parent, int index)
    {
        if (parent.ValueKind != JsonValueKind.Array || parent.GetArrayLength() <= index)
        {
            return Enumerable.Empty<JsonElement>();
        }

        var child = parent[index];
        return child.ValueKind == JsonValueKind.Array ? child.EnumerateArray() : Enumerable.Empty<JsonElement>();
    }
}

public class TranslateRequestDto
{
    public string? Text { get; set; }
}

public class QuickTranslateResult
{
    public string OriginalText { get; set; } = string.Empty;
    public string TranslatedText { get; set; } = string.Empty;
    public List<DictionaryEntry> Dict { get; set; } = new();
}

public class DictionaryEntry
{
    public string Pos { get; set; } = string.Empty;
    public List<string> Terms { get; set; } = new();
}
