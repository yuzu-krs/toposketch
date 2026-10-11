using ArchSketch.Api.Dtos;
using ArchSketch.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ArchSketch.Api.Controllers;

/// <summary>
/// Presentation Layer。HTTP の入出力（ルーティング・ステータスコード・ProblemDetails）に専念し、
/// 業務ロジックは IDiagramService へ委譲する。
/// </summary>
[ApiController]
[Route("api/diagrams")]
[Produces("application/json")]
public sealed class DiagramsController(IDiagramService service) : ControllerBase
{
    /// <summary>保存済み構成図の一覧（更新日の新しい順）。</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DiagramSummaryDto>>> List(CancellationToken cancellationToken)
    {
        return Ok(await service.ListAsync(cancellationToken));
    }

    /// <summary>指定IDの構成図を本文込みで取得する。</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DiagramDto>> Get(Guid id, CancellationToken cancellationToken)
    {
        var diagram = await service.GetAsync(id, cancellationToken);
        return diagram is null ? NotFound() : Ok(diagram);
    }

    /// <summary>新しい構成図を作成する。</summary>
    [HttpPost]
    public async Task<ActionResult<DiagramDto>> Create(
        [FromBody] CreateDiagramRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var created = await service.CreateAsync(request, cancellationToken);
            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }
        catch (DiagramValidationException ex)
        {
            return ValidationProblem(ex.Errors);
        }
    }

    /// <summary>既存の構成図を更新する。</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DiagramDto>> Update(
        Guid id,
        [FromBody] UpdateDiagramRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var updated = await service.UpdateAsync(id, request, cancellationToken);
            return Ok(updated);
        }
        catch (DiagramValidationException ex)
        {
            return ValidationProblem(ex.Errors);
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
        var deleted = await service.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    private ActionResult ValidationProblem(IReadOnlyList<string> errors) =>
        BadRequest(new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "リクエストが不正です。",
            Detail = string.Join(" ", errors),
            Extensions = { ["errors"] = errors },
        });
}
