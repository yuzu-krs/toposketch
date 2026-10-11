using ArchSketch.Api.Repositories;

namespace ArchSketch.Api.Services;

/// <summary>ストレージの到達確認と構成上のプロバイダ名をまとめたヘルス情報を返す。</summary>
public sealed class HealthService(IDiagramRepository repository, IConfiguration configuration) : IHealthService
{
    public async Task<HealthStatus> GetAsync(CancellationToken cancellationToken = default)
    {
        var provider = configuration["Storage:Provider"] ?? "InMemory";
        var healthy = await repository.IsHealthyAsync(cancellationToken);
        return new HealthStatus(healthy, provider);
    }
}
