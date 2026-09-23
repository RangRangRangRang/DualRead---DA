using HtmlAgilityPack;

namespace DualRead.Services;

public static class ChapterHtmlSanitizer
{
    public static string ExtractAndSanitize(string rawHtml, Func<string, string>? resolveAssetUrl)
    {
        if (string.IsNullOrWhiteSpace(rawHtml))
            return string.Empty;

        var doc = new HtmlDocument();
        doc.LoadHtml(rawHtml);

        var unsafeNodes = doc.DocumentNode.SelectNodes("//script|//style|//iframe|//meta|//link");
        if (unsafeNodes != null)
        {
            foreach (var node in unsafeNodes)
            {
                node.Remove();
            }
        }

        if (resolveAssetUrl != null)
        {
            var imgNodes = doc.DocumentNode.SelectNodes("//img[@src]");
            if (imgNodes != null)
            {
                foreach (var img in imgNodes)
                {
                    var srcAttr = img.Attributes["src"];
                    if (srcAttr != null && !string.IsNullOrWhiteSpace(srcAttr.Value))
                    {
                        srcAttr.Value = resolveAssetUrl(srcAttr.Value);
                    }
                }
            }

            var svgImageNodes = doc.DocumentNode.SelectNodes("//image");
            if (svgImageNodes != null)
            {
                foreach (var img in svgImageNodes)
                {
                    var hrefAttr = img.Attributes["xlink:href"] ?? img.Attributes["href"];
                    if (hrefAttr != null && !string.IsNullOrWhiteSpace(hrefAttr.Value))
                    {
                        hrefAttr.Value = resolveAssetUrl(hrefAttr.Value);
                    }
                }
            }
        }

        var bodyNode = doc.DocumentNode.SelectSingleNode("//body") ?? doc.DocumentNode;
        return bodyNode.InnerHtml;
    }
}
