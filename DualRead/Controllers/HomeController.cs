using DualRead.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace DualRead.Controllers;

public class HomeController : Controller
{
    [HttpGet]
    public IActionResult Index()
    {
        return View(new OpenLibraryViewModel());
    }

    [Route("/Home/Error")]
    public IActionResult Error()
    {
        Response.StatusCode = 500;
        return View();
    }

    [Route("/Home/StatusCode/{code:int}")]
    public IActionResult StatusCodeHandler(int code)
    {
        Response.StatusCode = code;
        ViewBag.StatusCode = code;
        ViewBag.StatusMessage = code switch
        {
            404 => "That page doesn't exist.",
            _ => "Something went wrong."
        };
        return View("Error");
    }
}
