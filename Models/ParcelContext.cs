using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ParcelManager.Models
{
    public class ParcelContext : DbContext
    {
        public ParcelContext(DbContextOptions<ParcelContext> options) : base(options) { }

        public DbSet<Parcel> Parcels { get; set; }

        public int Counter = 0;
    }
}
