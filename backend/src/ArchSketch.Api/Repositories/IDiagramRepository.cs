using ArchSketch.Api.Entities;

namespace ArchSketch.Api.Repositories;

/// <summary>
/// 構成図ドキュメントの永続化を担う Data Access Layer の抽象。
/// 実装は SQL Server（ストアドプロシージャ）または開発用 InMemory。
/// </summary>
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

    /// <summary>ストレージが利用可能かどうか（ヘルスチェック用）。</summary>
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);
}
