using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Optimus.Domain.Entities;

namespace Optimus.Infrastructure.Persistence.Seed;

internal static class LocationSeedData
{
    internal sealed record MetroManilaCitySeed(string Code, string Name);

    internal sealed record BarangaySeedEntry(string Code, string Name);

    internal static readonly MetroManilaCitySeed[] MetroManilaCities =
    {
        new("CALOOCAN", "Caloocan"),
        new("LASPINAS", "Las Piñas"),
        new("MKT", "Makati"),
        new("MALABON", "Malabon"),
        new("MANDALUYONG", "Mandaluyong"),
        new("MNL-CITY", "Manila"),
        new("MARIKINA", "Marikina"),
        new("MUNTINLUPA", "Muntinlupa"),
        new("NAVOTAS", "Navotas"),
        new("PARANAQUE", "Parañaque"),
        new("PASAY", "Pasay"),
        new("PASIG", "Pasig"),
        new("PATEROS", "Pateros"),
        new("QZN", "Quezon City"),
        new("SANJUAN", "San Juan"),
        new("TAGUIG", "Taguig"),
        new("VALENZUELA", "Valenzuela"),
    };

    private static readonly Lazy<IReadOnlyDictionary<string, IReadOnlyList<BarangaySeedEntry>>> MetroManilaBarangaysByCity =
        new(LoadMetroManilaBarangays);

    internal static async Task EnsureMetroManilaAsync(OptimusDbContext db, ILogger logger, CancellationToken ct = default)
    {
        var ncr = await db.Regions
            .Include(r => r.Provinces)
            .ThenInclude(p => p.Cities)
            .ThenInclude(c => c.Barangays)
            .FirstOrDefaultAsync(r => r.Code == "NCR", ct);

        if (ncr is null)
        {
            db.Regions.Add(BuildNcrRegion());
            await db.SaveChangesAsync(ct);
            logger.LogInformation(
                "Seeded National Capital Region with {Count} Metro Manila cities and {Barangays} barangays.",
                MetroManilaCities.Length,
                TotalBarangayCount());
            return;
        }

        var metro = ncr.Provinces.FirstOrDefault(p => p.Code == "MNL" || p.Name == "Metro Manila");
        if (metro is null)
        {
            metro = new Province { RegionId = ncr.Id, Code = "MNL", Name = "Metro Manila" };
            db.Provinces.Add(metro);
            await db.SaveChangesAsync(ct);
        }

        var addedCities = 0;
        var addedBarangays = 0;

        foreach (var citySeed in MetroManilaCities)
        {
            var city = metro.Cities.FirstOrDefault(c =>
                c.Code.Equals(citySeed.Code, StringComparison.OrdinalIgnoreCase)
                || c.Name.Equals(citySeed.Name, StringComparison.OrdinalIgnoreCase));

            if (city is null)
            {
                city = BuildCity(citySeed);
                city.ProvinceId = metro.Id;
                db.Cities.Add(city);
                addedCities++;
                continue;
            }

            addedBarangays += EnsureCityBarangays(db, city, citySeed.Code);
        }

        if (addedCities > 0 || db.ChangeTracker.HasChanges())
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation(
                "Ensured Metro Manila location data ({AddedCities} new cities, {AddedBarangays} new barangays, {TotalCities} cities).",
                addedCities,
                addedBarangays,
                MetroManilaCities.Length);
        }
    }

    internal static Region BuildNcrRegion()
    {
        var metroProvince = new Province
        {
            Code = "MNL",
            Name = "Metro Manila",
        };

        foreach (var citySeed in MetroManilaCities)
        {
            metroProvince.Cities.Add(BuildCity(citySeed));
        }

        return new Region
        {
            Code = "NCR",
            Name = "National Capital Region",
            Provinces = { metroProvince },
        };
    }

    private static int EnsureCityBarangays(OptimusDbContext db, City city, string cityCode)
    {
        if (!MetroManilaBarangaysByCity.Value.TryGetValue(cityCode, out var barangays))
        {
            return 0;
        }

        var added = 0;
        foreach (var entry in barangays)
        {
            if (city.Barangays.Any(b =>
                    (!string.IsNullOrEmpty(entry.Code) && !string.IsNullOrEmpty(b.Code)
                     && b.Code.Equals(entry.Code, StringComparison.OrdinalIgnoreCase))
                    || (!string.IsNullOrEmpty(entry.Name) && !string.IsNullOrEmpty(b.Name)
                        && b.Name.Equals(entry.Name, StringComparison.OrdinalIgnoreCase))))
            {
                continue;
            }

            db.Barangays.Add(new Barangay
            {
                CityId = city.Id,
                Code = entry.Code,
                Name = entry.Name,
            });
            added++;
        }

        return added;
    }

    private static City BuildCity(MetroManilaCitySeed seed)
    {
        var city = new City { Code = seed.Code, Name = seed.Name };
        if (!MetroManilaBarangaysByCity.Value.TryGetValue(seed.Code, out var barangays))
        {
            return city;
        }

        foreach (var entry in barangays)
        {
            city.Barangays.Add(new Barangay
            {
                Code = entry.Code,
                Name = entry.Name,
            });
        }

        return city;
    }

    private static int TotalBarangayCount()
        => MetroManilaBarangaysByCity.Value.Values.Sum(list => list.Count);

    private static IReadOnlyDictionary<string, IReadOnlyList<BarangaySeedEntry>> LoadMetroManilaBarangays()
    {
        var assembly = typeof(LocationSeedData).Assembly;
        const string resourceName = "Optimus.Infrastructure.Persistence.Seed.Data.metro-manila-barangays.json";
        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Missing embedded resource {resourceName}.");

        var raw = JsonSerializer.Deserialize<Dictionary<string, List<BarangaySeedEntry>>>(
            stream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? throw new InvalidOperationException("Could not parse Metro Manila barangay seed data.");

        return raw.ToDictionary(
            pair => pair.Key,
            pair => (IReadOnlyList<BarangaySeedEntry>)pair.Value
                .OrderBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
                .ToList(),
            StringComparer.OrdinalIgnoreCase);
    }
}
