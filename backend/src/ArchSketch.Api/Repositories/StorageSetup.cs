namespace ArchSketch.Api.Repositories;

/// <summary>Data Access Layer の登録を行う拡張メソッド。構成は appsettings.json の Storage セクション。</summary>
public static class StorageSetup
{
    /// <summary>
    /// Storage:Provider 設定に応じて IDiagramRepository を登録し、採用されたプロバイダ名を返す。
    /// - InMemory : 開発用の揮発性ストレージ（既定）
    /// - SqlServer: SQL Server + ストアドプロシージャ（Storage:InitializeDatabase が true なら起動時にスキーマ自動初期化）
    /// </summary>
    public static string AddDiagramStorage(this IServiceCollection services, IConfiguration configuration)
    {
        var provider = (configuration["Storage:Provider"] ?? "InMemory").Trim();

        if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            var connectionString = configuration.GetConnectionString("ArchSketch")
                ?? throw new InvalidOperationException(
                    "Storage:Provider が SqlServer の場合は ConnectionStrings:ArchSketch の設定が必要です。");

            services.AddSingleton<IDiagramRepository>(_ => new SqlServerDiagramRepository(connectionString));

            if (configuration.GetValue("Storage:InitializeDatabase", true))
            {
                services.AddHostedService(sp => new DatabaseInitializerService(
                    connectionString,
                    sp.GetRequiredService<ILogger<DatabaseInitializerService>>()));
            }
        }
        else if (provider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IDiagramRepository, InMemoryDiagramRepository>();
        }
        else
        {
            throw new InvalidOperationException(
                $"不明な Storage:Provider '{provider}' です。InMemory または SqlServer を指定してください。");
        }

        return provider;
    }

    /// <summary>起動時に db/*.sql を冪等に適用するホステッドサービス。失敗時は起動を中断し、原因をログに出す。</summary>
    private sealed class DatabaseInitializerService(
        string connectionString,
        ILogger<DatabaseInitializerService> logger)
        : Microsoft.Extensions.Hosting.BackgroundService
    {
        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                DatabaseInitializer.Initialize(connectionString, logger);
                logger.LogInformation("Database schema initialized (db/*.sql applied idempotently).");
            }
            catch (Microsoft.Data.SqlClient.SqlException ex)
            {
                logger.LogCritical(ex,
                    "データベースの初期化に失敗しました。localhost 上の SQL Server が起動しているか確認してください。" +
                    "手動で db/*.sql を実行するか、Storage:Provider を InMemory に変更してください。");
                throw;
            }

            return Task.CompletedTask;
        }
    }
}
