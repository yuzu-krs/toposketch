using ArchSketch.Api.Storage;
using Xunit;

namespace ArchSketch.Api.Tests;

public class InMemoryDiagramRepositoryTests
{
    [Fact]
    public async Task CreateAsync_AssignsIdAndTimestamps()
    {
        var repository = new InMemoryDiagramRepository();

        var diagram = await repository.CreateAsync("テスト図", """{"schema":1,"nodes":[]}""");

        Assert.NotEqual(Guid.Empty, diagram.Id);
        Assert.Equal("テスト図", diagram.Name);
        Assert.Equal("""{"schema":1,"nodes":[]}""", diagram.ContentJson);
        Assert.True(diagram.UpdatedAtUtc >= diagram.CreatedAtUtc);
    }

    [Fact]
    public async Task GetAsync_ReturnsStoredDocument_AndNullForMissing()
    {
        var repository = new InMemoryDiagramRepository();
        var created = await repository.CreateAsync("図1", "{}");

        var loaded = await repository.GetAsync(created.Id);

        Assert.NotNull(loaded);
        Assert.Equal(created.Id, loaded!.Id);
        Assert.Equal("図1", loaded.Name);
        Assert.Null(await repository.GetAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task UpdateAsync_UpdatesNameAndContent_AndThrowsForMissing()
    {
        var repository = new InMemoryDiagramRepository();
        var created = await repository.CreateAsync("旧名称", "{}");

        var updated = await repository.UpdateAsync(created.Id, "新名称", """{"schema":1}""");

        Assert.Equal("新名称", updated.Name);
        Assert.Equal("""{"schema":1}""", updated.ContentJson);
        Assert.True(updated.UpdatedAtUtc >= created.UpdatedAtUtc);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => repository.UpdateAsync(Guid.NewGuid(), "x", "{}"));
    }

    [Fact]
    public async Task DeleteAsync_ReturnsTrueOnce_ThenGetReturnsNull()
    {
        var repository = new InMemoryDiagramRepository();
        var created = await repository.CreateAsync("図", "{}");

        Assert.True(await repository.DeleteAsync(created.Id));
        Assert.False(await repository.DeleteAsync(created.Id));
        Assert.Null(await repository.GetAsync(created.Id));
    }

    [Fact]
    public async Task ListAsync_OrdersByUpdatedAtDescending()
    {
        var repository = new InMemoryDiagramRepository();
        var first = await repository.CreateAsync("古い方", "{}");
        await repository.UpdateAsync(first.Id, "古い方（更新済み）", "{}");
        await repository.CreateAsync("新しい方", "{}");

        var list = await repository.ListAsync();

        Assert.Equal("新しい方", list[0].Name);
        Assert.Equal("古い方（更新済み）", list[1].Name);
        Assert.All(list, s => Assert.NotEqual(0, s.ContentLengthChars));
    }

    [Fact]
    public async Task IsHealthyAsync_AlwaysTrue()
    {
        var repository = new InMemoryDiagramRepository();
        Assert.True(await repository.IsHealthyAsync());
    }
}
