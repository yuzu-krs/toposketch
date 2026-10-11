using ArchSketch.Api.Storage;
using Microsoft.AspNetCore.Mvc;

namespace ArchSketch.Api.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController(IDiagramRepository repository, IConfiguration configuration) : ControllerBase
{
    /// <summary>ストレージの状態を含むヘルスチェック。</summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var provider = configuration["Storage:Provider"] ?? "InMemory";
        var healthy = await repository.IsHealthyAsync(cancellationToken);
        return healthy
            ? Ok(new { status = "ok", storage = provider })
            : StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "degraded", storage = provider });
    }
}
