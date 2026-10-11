namespace ArchSketch.Api.Services;

/// <summary>リクエストの検証に失敗した場合に Service が投げる例外。Presentation 層が 400 に変換する。</summary>
public sealed class DiagramValidationException : Exception
{
    public IReadOnlyList<string> Errors { get; }

    public DiagramValidationException(IReadOnlyList<string> errors)
        : base(string.Join(" ", errors))
    {
        Errors = errors;
    }
}
