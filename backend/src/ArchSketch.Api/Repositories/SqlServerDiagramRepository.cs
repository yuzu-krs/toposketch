using System.Data;
using ArchSketch.Api.Entities;
using Microsoft.Data.SqlClient;

namespace ArchSketch.Api.Repositories;

/// <summary>
/// SQL Server 上のストアドプロシージャを介して構成図を永続化する Data Access Layer の実装。
/// すべてのデータアクセスは db/03_create_procedures.sql で定義された
/// dbo.usp_Diagrams_* プロシージャ呼び出しのみで行う。
/// </summary>
public sealed class SqlServerDiagramRepository : IDiagramRepository
{
    private const int DiagramNotFoundErrorNumber = 50001;

    private readonly string _connectionString;

    public SqlServerDiagramRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<IReadOnlyList<DiagramSummary>> ListAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand("dbo.usp_Diagrams_List", connection)
            {
                CommandType = CommandType.StoredProcedure,
            };
            await connection.OpenAsync(cancellationToken);

            var results = new List<DiagramSummary>();
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                results.Add(new DiagramSummary(
                    reader.GetGuid(0),
                    reader.GetString(1),
                    ToUtcOffset(reader.GetDateTime(2)),
                    ToUtcOffset(reader.GetDateTime(3)),
                    reader.GetInt64(4)));
            }
            return results;
        }
        catch (SqlException ex)
        {
            throw DiagramStorageUnavailableException.Wrap(ex);
        }
    }

    public async Task<Diagram?> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand("dbo.usp_Diagrams_GetById", connection)
            {
                CommandType = CommandType.StoredProcedure,
            };
            command.Parameters.Add("@Id", SqlDbType.UniqueIdentifier).Value = id;
            await connection.OpenAsync(cancellationToken);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                return null;
            }
            return ReadDiagram(reader);
        }
        catch (SqlException ex)
        {
            throw DiagramStorageUnavailableException.Wrap(ex);
        }
    }

    public async Task<Diagram> CreateAsync(string name, string contentJson, CancellationToken cancellationToken = default)
    {
        try
        {
            var id = Guid.NewGuid();
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand("dbo.usp_Diagrams_Insert", connection)
            {
                CommandType = CommandType.StoredProcedure,
            };
            command.Parameters.Add("@Id", SqlDbType.UniqueIdentifier).Value = id;
            command.Parameters.Add("@Name", SqlDbType.NVarChar, 200).Value = name;
            command.Parameters.Add("@ContentJson", SqlDbType.NVarChar, -1).Value = contentJson;
            await connection.OpenAsync(cancellationToken);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                throw new InvalidOperationException("usp_Diagrams_Insert did not return the inserted row.");
            }
            return ReadDiagram(reader);
        }
        catch (SqlException ex)
        {
            throw DiagramStorageUnavailableException.Wrap(ex);
        }
    }

    public async Task<Diagram> UpdateAsync(Guid id, string name, string contentJson, CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand("dbo.usp_Diagrams_Update", connection)
            {
                CommandType = CommandType.StoredProcedure,
            };
            command.Parameters.Add("@Id", SqlDbType.UniqueIdentifier).Value = id;
            command.Parameters.Add("@Name", SqlDbType.NVarChar, 200).Value = name;
            command.Parameters.Add("@ContentJson", SqlDbType.NVarChar, -1).Value = contentJson;
            await connection.OpenAsync(cancellationToken);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                throw new KeyNotFoundException($"Diagram {id} was not found.");
            }
            return ReadDiagram(reader);
        }
        catch (SqlException ex) when (ex.Number == DiagramNotFoundErrorNumber)
        {
            throw new KeyNotFoundException($"Diagram {id} was not found.");
        }
        catch (SqlException ex)
        {
            throw DiagramStorageUnavailableException.Wrap(ex);
        }
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand("dbo.usp_Diagrams_Delete", connection)
            {
                CommandType = CommandType.StoredProcedure,
            };
            command.Parameters.Add("@Id", SqlDbType.UniqueIdentifier).Value = id;
            await connection.OpenAsync(cancellationToken);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            return await reader.ReadAsync(cancellationToken) && reader.GetInt32(0) > 0;
        }
        catch (SqlException ex)
        {
            throw DiagramStorageUnavailableException.Wrap(ex);
        }
    }

    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand("SELECT 1", connection);
            await connection.OpenAsync(cancellationToken);
            var result = await command.ExecuteScalarAsync(cancellationToken);
            return Equals(result, 1);
        }
        catch (SqlException)
        {
            return false;
        }
    }

    private static Diagram ReadDiagram(SqlDataReader reader) => new(
        reader.GetGuid(0),
        reader.GetString(1),
        reader.GetString(2),
        ToUtcOffset(reader.GetDateTime(3)),
        ToUtcOffset(reader.GetDateTime(4)));

    private static DateTimeOffset ToUtcOffset(DateTime dateTime) =>
        new(DateTime.SpecifyKind(dateTime, DateTimeKind.Utc), TimeSpan.Zero);
}
