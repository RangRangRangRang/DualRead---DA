using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace DualRead.Controllers;

[ApiController]
[Route("api/translate")]
public class QuickTranslateController : ControllerBase
{
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
        if (trimmed.Length > 8000)
        {
            trimmed = trimmed.Substring(0, 8000);
        }

        var cacheKey = $"trans:{sl}:{tl}:{trimmed.ToLowerInvariant()}";
        if (_cache.TryGetValue(cacheKey, out QuickTranslateResult? cached) && cached != null)
        {
            return Ok(cached);
        }

        var result = await PerformTranslationAsync(trimmed, sl, tl);
        if (result != null)
        {
            _cache.Set(cacheKey, result, TimeSpan.FromHours(24));
            return Ok(result);
        }

        return StatusCode(502, new { error = "Translation service temporarily unavailable." });
    }

    private async Task<QuickTranslateResult?> PerformTranslationAsync(string text, string sl, string tl)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

        var isSingleWord = text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length <= 2;

        try
        {
            var formParams = new List<KeyValuePair<string, string>>
            {
                new("client", "gtx"),
                new("sl", sl),
                new("tl", tl),
                new("dt", "t"),
                new("q", text)
            };

            if (isSingleWord)
            {
                formParams.Add(new("dt", "bd"));
            }

            var formContent = new FormUrlEncodedContent(formParams);
            var response = await client.PostAsync("https://translate.googleapis.com/translate_a/single", formContent);

            if (response.IsSuccessStatusCode)
            {
                var jsonString = await response.Content.ReadAsStringAsync();
                var parsed = ParseGoogleTranslateJson(jsonString, text);
                if (parsed != null && !string.IsNullOrWhiteSpace(parsed.TranslatedText))
                {
                    return parsed;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Primary translation strategy (POST gtx) failed.");
        }

        try
        {
            var url = isSingleWord
                ? $"https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&dt=bd&q={Uri.EscapeDataString(text)}"
                : $"https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q={Uri.EscapeDataString(text)}";

            var response = await client.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                var jsonString = await response.Content.ReadAsStringAsync();
                var parsed = ParseGoogleTranslateJson(jsonString, text);
                if (parsed != null && !string.IsNullOrWhiteSpace(parsed.TranslatedText))
                {
                    return parsed;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Secondary translation strategy (GET gtx) failed.");
        }

        try
        {
            var fallbackUrl = $"https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl={sl}&tl={tl}&q={Uri.EscapeDataString(text)}";
            var fallbackResponse = await client.GetAsync(fallbackUrl);
            if (fallbackResponse.IsSuccessStatusCode)
            {
                var json = await fallbackResponse.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                {
                    var trans = doc.RootElement[0].GetString() ?? "";
                    if (!string.IsNullOrWhiteSpace(trans))
                    {
                        return new QuickTranslateResult
                        {
                            OriginalText = text,
                            TranslatedText = trans
                        };
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tertiary translation strategy failed.");
        }

        return null;
    }

    private static QuickTranslateResult? ParseGoogleTranslateJson(string jsonString, string original)
    {
        try
        {
            using var doc = JsonDocument.Parse(jsonString);
            var root = doc.RootElement;

            var sb = new System.Text.StringBuilder();
            if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
            {
                var sentences = root[0];
                if (sentences.ValueKind == JsonValueKind.Array)
                {
                    foreach (var sentence in sentences.EnumerateArray())
                    {
                        if (sentence.ValueKind == JsonValueKind.Array && sentence.GetArrayLength() > 0)
                        {
                            var part = sentence[0].GetString();
                            if (!string.IsNullOrEmpty(part))
                            {
                                sb.Append(part);
                            }
                        }
                    }
                }
            }

            var translatedText = sb.ToString().Trim();
            if (string.IsNullOrEmpty(translatedText))
            {
                translatedText = original;
            }

            var dictEntries = new List<DictionaryEntry>();
            if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 1)
            {
                var dictArray = root[1];
                if (dictArray.ValueKind == JsonValueKind.Array)
                {
                    foreach (var group in dictArray.EnumerateArray())
                    {
                        if (group.ValueKind == JsonValueKind.Array && group.GetArrayLength() >= 2)
                        {
                            var pos = group[0].GetString() ?? "";
                            var terms = new List<string>();
                            if (group[1].ValueKind == JsonValueKind.Array)
                            {
                                foreach (var term in group[1].EnumerateArray())
                                {
                                    var termStr = term.GetString();
                                    if (!string.IsNullOrEmpty(termStr)) terms.Add(termStr);
                                }
                            }

                            if (!string.IsNullOrEmpty(pos) && terms.Count > 0)
                            {
                                dictEntries.Add(new DictionaryEntry { Pos = pos, Terms = terms.Take(5).ToList() });
                            }
                        }
                    }
                }
            }

            return new QuickTranslateResult
            {
                OriginalText = original,
                TranslatedText = translatedText,
                Dict = dictEntries
            };
        }
        catch
        {
            return null;
        }
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
