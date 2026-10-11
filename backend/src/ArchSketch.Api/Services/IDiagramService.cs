using ArchSketch.Api.Dtos;

namespace ArchSketch.Api.Services;

/// <summary>構成図ドキュメントに関する業務ロジックの抽象（Business Logic Layer）。</summary>
public interface IDiagramService
{
    /// <summary>保存済み構成図の一覧（更新日の新しい順）。</summary>
    Task<IReadOnlyList<DiagramSummaryDto>> ListAsync(CancellationToken cancellationToken = default);

    /// <summary>指定IDの構成図を取得する。存在しない場合は null。</summary>
    Task<DiagramDto?> GetAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>新しい構成図を作成する。リクエストが不正な場合は <see cref="DiagramValidationException"/>。</summary>
    Task<DiagramDto> CreateAsync(CreateDiagramRequest request, CancellationToken cancellationToken = default);

    /// <summary>既存の構成図を更新する。不正リクエストは <see cref="DiagramValidationException"/>、
    /// 存在しない場合は <see cref="KeyNotFoundException"/>。</summary>
    Task<DiagramDto> UpdateAsync(Guid id, UpdateDiagramRequest request, CancellationToken cancellationToken = default);

    /// <summary>構成図を削除する。削除できた場合 true。</summary>
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
