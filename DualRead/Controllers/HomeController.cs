using DualRead.Services.Interfaces;
using DualRead.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace DualRead.Controllers;

public class HomeController : Controller
{
    private readonly IRecoveryKeyService _recoveryKeyService;
    private readonly ICurrentRecoveryKeyAccessor _currentRecoveryKeyAccessor;

    public HomeController(IRecoveryKeyService recoveryKeyService, ICurrentRecoveryKeyAccessor currentRecoveryKeyAccessor)
    {
        _recoveryKeyService = recoveryKeyService;
        _currentRecoveryKeyAccessor = currentRecoveryKeyAccessor;
    }

    [HttpGet]
    public IActionResult Index()
    {
        return View(new OpenLibraryViewModel());
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> OpenLibrary(OpenLibraryViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return View("Index", model);
        }

        var recoveryKey = await _recoveryKeyService.ValidateAsync(model.RecoveryKeyCode);
        if (recoveryKey is null)
        {
            model.ErrorMessage = "Không tìm thấy Recovery Key này. Kiểm tra lại và thử lại.";
            return View("Index", model);
        }

        _currentRecoveryKeyAccessor.SetActiveKeyCookie(recoveryKey.Id);
        return RedirectToAction("Index", "Library");
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
