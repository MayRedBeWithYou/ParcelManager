using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParcelManager.Models;

namespace ParcelManager.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ParcelsController : ControllerBase
    {
        private readonly ParcelContext context;

        public ParcelsController(ParcelContext ctx)
        {
            context = ctx;

            if (context.Parcels.Count() == 0)
            {
                //Add test parcel
                context.Parcels.Add(new Parcel { Id = 0, City = "Warsaw", SendDate = DateTime.Now, Latitude = 30, Longitude = 30 });
                context.SaveChanges();
            }
        }

        [HttpGet]
        public IEnumerable<Parcel> GetParcels()
        {
            return context.Parcels.AsEnumerable();
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser([FromRoute] int id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var parcel = await context.Parcels.FindAsync(id);

            if (parcel == null)
            {
                return NotFound();
            }

            return Ok(parcel);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutParcel([FromRoute] int id, [FromBody] Parcel parcel)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != parcel.Id)
            {
                return BadRequest();
            }

            context.Entry(parcel).State = EntityState.Modified;

            try
            {
                await context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ParcelExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpPost]
        public async Task<IActionResult> PostParcel([FromBody] Parcel parcel)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            context.Parcels.AddRange(parcel);
            await context.SaveChangesAsync();

            return CreatedAtAction("GetUser", new { id = parcel.Id }, parcel);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteParcel([FromRoute] int id)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var parcel = await context.Parcels.FindAsync(id);
            if (parcel == null)
            {
                return NotFound();
            }

            context.Parcels.Remove(parcel);
            await context.SaveChangesAsync();

            return Ok(parcel);
        }

        private bool ParcelExists(int id)
        {
            return context.Parcels.Any(e => e.Id == id);
        }
    }
}
