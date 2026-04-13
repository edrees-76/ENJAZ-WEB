namespace backend.Models
{
    /// <summary>
    /// Core-B M3: Query parameters for paginated endpoints.
    /// </summary>
    public class PaginationQuery
    {
        private int _page = 1;
        private int _pageSize = 20;

        public int Page
        {
            get => _page;
            set => _page = Math.Max(1, value);
        }

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = Math.Clamp(value, 1, 100);
        }

        public string? Cursor { get; set; }
        public string? SortBy { get; set; }
        public string? SortDirection { get; set; } = "desc";
    }

    /// <summary>
    /// Core-B M3: Utility methods for cursor encoding/decoding.
    /// Cursor format: Base64(timestamp|id) for compound sort key.
    /// </summary>
    public static class CursorHelper
    {
        public static string Encode(DateTime timestamp, int id)
        {
            var raw = $"{timestamp:O}|{id}";
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(raw));
        }

        public static (DateTime Timestamp, int Id)? Decode(string? cursor)
        {
            if (string.IsNullOrWhiteSpace(cursor)) return null;

            try
            {
                var raw = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
                var parts = raw.Split('|');
                if (parts.Length != 2) return null;

                return (DateTime.Parse(parts[0]), int.Parse(parts[1]));
            }
            catch
            {
                return null;
            }
        }
    }
}
