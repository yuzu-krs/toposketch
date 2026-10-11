using ArchSketch.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ArchSketch.Api.Controllers;

/// <summary>ヘルスチェックエンドポイント（Presentation Layer）。</summary>
[ApiController]
[Route("api/health")]
public sealed class HealthController(IHealthService service) : ControllerBase
{
    /// <summary>ストレージの状態を含むヘルスチェック。</summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var status = await service.GetAsync(cancellationToken);
        return status.Healthy
            ? Ok(new { status = "ok", storage = status.StorageProvider })
            : StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { status = "degraded", storage = status.StorageProvider });
    }
}
