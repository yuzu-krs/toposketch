using ArchSketch.Api.Storage;
using Microsoft.AspNetCore.Mvc;

namespace ArchSketch.Api.Controllers;

[ApiController]
[Route("api/diagrams")]
[Produces("application/json")]
public sealed class DiagramsController(IDiagramRepository repository) : ControllerBase
{
    /// <summary>保存済み構成図の一覧（更新日の新しい順）。</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DiagramSummaryDto>>> List(CancellationToken cancellationToken)
    {
        var summaries = await repository.ListAsync(cancellationToken);
        return Ok(summaries.Select(ToDto).ToList());
    }

    /// <summary>指定IDの構成図を本文込みで取得する。</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DiagramDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var diagram = await repository.GetAsync(id, cancellationToken);
        return diagram is null ? NotFound() : Ok(ToDto(diagram));
    }

    /// <summary>新しい構成図を作成する。</summary>
    [HttpPost]
    public async Task<ActionResult<DiagramDto>> Create(
        [FromBody] CreateDiagramRequest request,
        CancellationToken cancellationToken)
    {
        var errors = DiagramValidation.Validate(request.Name, request.ContentJson, requireContent: true);
        if (errors.Count > 0)
        {
            return ValidationProblem(errors);
        }

        var created = await repository.CreateAsync(request.Name!.Trim(), request.ContentJson!, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, ToDto(created));
    }

    /// <summary>既存の構成図を更新する。</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DiagramDto>> Update(
        Guid id,
        [FromBody] UpdateDiagramRequest request,
        CancellationToken cancellationToken)
    {
        var errors = DiagramValidation.Validate(request.Name, request.ContentJson, requireContent: true);
        if (errors.Count > 0)
        {
            return ValidationProblem(errors);
        }

        try
        {
            var updated = await repository.UpdateAsync(id, request.Name!.Trim(), request.ContentJson!, cancellationToken);
            return Ok(ToDto(updated));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>構成図を削除する。</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await repository.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    private static DiagramDto ToDto(Diagram diagram) =>
        new(diagram.Id, diagram.Name, diagram.ContentJson, diagram.CreatedAtUtc, diagram.UpdatedAtUtc);

    private static DiagramSummaryDto ToDto(DiagramSummary summary) =>
        new(summary.Id, summary.Name, summary.CreatedAtUtc, summary.UpdatedAtUtc, summary.ContentLengthChars);

    private ActionResult ValidationProblem(List<string> errors) =>
        BadRequest(new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "リクエストが不正です。",
            Detail = string.Join(" ", errors),
            Extensions = { ["errors"] = errors },
        });
}
