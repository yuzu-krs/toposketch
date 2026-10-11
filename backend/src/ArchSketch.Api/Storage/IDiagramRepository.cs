namespace ArchSketch.Api.Storage;

/// <summary>構成図ドキュメントの永続化を担うリポジトリの抽象。</summary>
public interface IDiagramRepository
{
    /// <summary>保存日時の新しい順に一覧を返す。</summary>
    Task<IReadOnlyList<DiagramSummary>> ListAsync(CancellationToken cancellationToken = default);

    /// <summary>指定IDの構成図を取得する。存在しない場合は null。</summary>
    Task<Diagram?> GetAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>新規作成する。ID はリポジトリ側で採番する。</summary>
    Task<Diagram> CreateAsync(string name, string contentJson, CancellationToken cancellationToken = default);

    /// <summary>更新する。存在しない場合は <see cref="KeyNotFoundException"/>。</summary>
    Task<Diagram> UpdateAsync(Guid id, string name, string contentJson, CancellationToken cancellationToken = default);

    /// <summary>削除する。削除できた場合 true。</summary>
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>バックエンドのストレージが利用可能かどうか（ヘルスチェック用）。</summary>
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);
}

/// <summary>構成図の完全なレコード。</summary>
public sealed record Diagram(
    Guid Id,
    string Name,
    string ContentJson,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

/// <summary>一覧表示用のサマリ（JSON本文を含まない）。</summary>
public sealed record DiagramSummary(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    long ContentLengthChars);
