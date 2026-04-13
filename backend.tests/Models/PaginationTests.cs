using backend.Models;
using Xunit;

namespace backend.tests.Models
{
    /// <summary>
    /// Tests for CursorHelper — encoding/decoding cursor tokens.
    /// </summary>
    public class CursorHelperTests
    {
        [Fact]
        public void Encode_ProducesNonEmptyString()
        {
            var cursor = CursorHelper.Encode(DateTime.UtcNow, 42);
            Assert.False(string.IsNullOrWhiteSpace(cursor));
        }

        [Fact]
        public void Decode_ValidCursor_ReturnsCorrectValues()
        {
            var timestamp = new DateTime(2026, 4, 13, 10, 30, 0, DateTimeKind.Utc);
            var id = 99;

            var encoded = CursorHelper.Encode(timestamp, id);
            var decoded = CursorHelper.Decode(encoded);

            Assert.NotNull(decoded);
            Assert.Equal(id, decoded.Value.Id);
        }

        [Fact]
        public void Decode_Null_ReturnsNull()
        {
            var result = CursorHelper.Decode(null);
            Assert.Null(result);
        }

        [Fact]
        public void Decode_EmptyString_ReturnsNull()
        {
            var result = CursorHelper.Decode("");
            Assert.Null(result);
        }

        [Fact]
        public void Decode_InvalidBase64_ReturnsNull()
        {
            var result = CursorHelper.Decode("not-valid-base64!!!");
            Assert.Null(result);
        }

        [Fact]
        public void Decode_MalformedContent_ReturnsNull()
        {
            var badCursor = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("no-pipe-here"));
            var result = CursorHelper.Decode(badCursor);
            Assert.Null(result);
        }

        [Fact]
        public void RoundTrip_PreservesId()
        {
            var timestamp = DateTime.UtcNow;
            var id = 12345;

            var encoded = CursorHelper.Encode(timestamp, id);
            var decoded = CursorHelper.Decode(encoded);

            Assert.NotNull(decoded);
            Assert.Equal(id, decoded.Value.Id);
        }
    }

    /// <summary>
    /// Tests for PaginationQuery — input clamping.
    /// </summary>
    public class PaginationQueryTests
    {
        [Fact]
        public void PageSize_ClampedTo100Max()
        {
            var query = new PaginationQuery { PageSize = 500 };
            Assert.Equal(100, query.PageSize);
        }

        [Fact]
        public void PageSize_ClampedTo1Min()
        {
            var query = new PaginationQuery { PageSize = -5 };
            Assert.Equal(1, query.PageSize);
        }

        [Fact]
        public void Page_MinimumIs1()
        {
            var query = new PaginationQuery { Page = 0 };
            Assert.Equal(1, query.Page);
        }

        [Fact]
        public void Page_NegativeBecomesOne()
        {
            var query = new PaginationQuery { Page = -10 };
            Assert.Equal(1, query.Page);
        }

        [Fact]
        public void Defaults_AreCorrect()
        {
            var query = new PaginationQuery();
            Assert.Equal(1, query.Page);
            Assert.Equal(20, query.PageSize);
            Assert.Null(query.Cursor);
            Assert.Equal("desc", query.SortDirection);
        }
    }
}
