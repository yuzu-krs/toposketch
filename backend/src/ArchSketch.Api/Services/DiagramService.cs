using ArchSketch.Api.Dtos;
using ArchSketch.Api.Entities;
using ArchSketch.Api.Repositories;

namespace ArchSketch.Api.Services;

/// <summary>
/// 構成図ドキュメントの業務ロジック（Business Logic Layer）。
/// リクエスト検証・正規化・Entity⇔DTO 変換を担い、Data Access Layer の詳細を隠蔽する。
/// </summary>
public sealed class DiagramService(IDiagramRepository repository) : IDiagramService
{
    public async Task<IReadOnlyList<DiagramSummaryDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        var summaries = await repository.ListAsync(cancellationToken);
        return summaries.Select(ToDto).ToList();
    }

    public async Task<DiagramDto?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var diagram = await repository.GetAsync(id, cancellationToken);
        return diagram is null ? null : ToDto(diagram);
    }

    public async Task<DiagramDto> CreateAsync(CreateDiagramRequest request, CancellationToken cancellationToken = default)
    {
        var (name, contentJson) = ValidateAndNormalize(request.Name, request.ContentJson);
        var created = await repository.CreateAsync(name, contentJson, cancellationToken);
        return ToDto(created);
    }

    public async Task<DiagramDto> UpdateAsync(Guid id, UpdateDiagramRequest request, CancellationToken cancellationToken = default)
    {
        var (name, contentJson) = ValidateAndNormalize(request.Name, request.ContentJson);
        var updated = await repository.UpdateAsync(id, name, contentJson, cancellationToken);
        return ToDto(updated);
    }

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return repository.DeleteAsync(id, cancellationToken);
    }

    /// <summary>検証し、正規化済みの (name, contentJson) を返す。不正な場合は例外を投げる。</summary>
    private static (string Name, string ContentJson) ValidateAndNormalize(string? name, string? contentJson)
    {
        var errors = DiagramValidation.Validate(name, contentJson);
        if (errors.Count > 0)
        {
            throw new DiagramValidationException(errors);
        }
        return (name!.Trim(), contentJson!);
    }

    private static DiagramDto ToDto(Diagram diagram) =>
        new(diagram.Id, diagram.Name, diagram.ContentJson, diagram.CreatedAtUtc, diagram.UpdatedAtUtc);

    private static DiagramSummaryDto ToDto(DiagramSummary summary) =>
        new(summary.Id, summary.Name, summary.CreatedAtUtc, summary.UpdatedAtUtc, summary.ContentLengthChars);
}
