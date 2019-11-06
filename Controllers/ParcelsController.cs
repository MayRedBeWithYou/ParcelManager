using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
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
                context.Parcels.Add(new Parcel { Id = 0, City = "Warsaw", SendDate = DateTime.Now });
                context.SaveChanges();
            }
        }

        // Testing
        [HttpGet]
        public ActionResult<Parcel> GetTest()
        {
            Parcel parcel = context.Parcels.First();

            if (parcel == null)
            {
                return NotFound();
            }

            return parcel;
        }
    }
}
