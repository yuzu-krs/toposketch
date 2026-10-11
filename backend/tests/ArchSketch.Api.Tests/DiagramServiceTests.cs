using ArchSketch.Api.Dtos;
using ArchSketch.Api.Repositories;
using ArchSketch.Api.Services;
using Xunit;

namespace ArchSketch.Api.Tests;

/// <summary>Business Logic Layer の単体テスト（リポジトリには InMemory 実装を使用）。</summary>
public class DiagramServiceTests
{
    private readonly DiagramService _service = new(new InMemoryDiagramRepository());

    [Fact]
    public async Task CreateAsync_TrimsName_AndReturnsMappedDto()
    {
        var dto = await _service.CreateAsync(new CreateDiagramRequest("  サンプル図  ", """{"schema":1}"""));

        Assert.Equal("サンプル図", dto.Name);
        Assert.Equal("""{"schema":1}""", dto.ContentJson);
        Assert.NotEqual(Guid.Empty, dto.Id);
        Assert.True(dto.UpdatedAtUtc >= dto.CreatedAtUtc);
    }

    [Fact]
    public async Task CreateAsync_InvalidRequest_ThrowsWithMessages()
    {
        var exception = await Assert.ThrowsAsync<DiagramValidationException>(
            () => _service.CreateAsync(new CreateDiagramRequest(null, "not-json")));

        Assert.Contains(exception.Errors, e => e.Contains("name は必須"));
        Assert.Contains(exception.Errors, e => e.Contains("有効な JSON"));
    }

    [Fact]
    public async Task CreateAsync_TooLongName_Throws()
    {
        var exception = await Assert.ThrowsAsync<DiagramValidationException>(
            () => _service.CreateAsync(new CreateDiagramRequest(new string('あ', 201), "{}")));

        Assert.Contains(exception.Errors, e => e.Contains("200 文字以内"));
    }

    [Fact]
    public async Task GetAsync_MissingId_ReturnsNull()
    {
        Assert.Null(await _service.GetAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task UpdateAsync_MissingId_ThrowsKeyNotFound()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _service.UpdateAsync(Guid.NewGuid(), new UpdateDiagramRequest("x", "{}")));
    }

    [Fact]
    public async Task ListAsync_ReturnsSummariesNewestFirst()
    {
        var first = await _service.CreateAsync(new CreateDiagramRequest("古い方", "{}"));
        await Task.Delay(10);
        await _service.CreateAsync(new CreateDiagramRequest("新しい方", "{}"));

        var list = await _service.ListAsync();

        Assert.Equal("新しい方", list[0].Name);
        Assert.Equal("古い方", list[1].Name);
        Assert.All(list, s => Assert.Equal(2, s.ContentLengthChars));
        Assert.DoesNotContain(list, s => s.ContentLengthChars != 2);
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepository()
    {
        var created = await _service.CreateAsync(new CreateDiagramRequest("削除対象", "{}"));

        Assert.True(await _service.DeleteAsync(created.Id));
        Assert.False(await _service.DeleteAsync(created.Id));
        Assert.Null(await _service.GetAsync(created.Id));
    }
}
