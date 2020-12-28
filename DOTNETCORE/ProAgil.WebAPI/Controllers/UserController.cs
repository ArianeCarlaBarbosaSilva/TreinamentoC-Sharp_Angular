using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ProAgil.Domain.Identity;
using ProAgil.WebAPI.Dtos;

namespace ProAgil.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IMapper _mapper;

        public UserController(IConfiguration config, 
                            UserManager<User> userManager,
                            SignInManager<User> signInManager,
                            IMapper mapper)
        {
            _config = config;
            _userManager = userManager;
            _signInManager = signInManager;
            _mapper = mapper;
        }

        [HttpGet("GetUser")]
        public async Task<IActionResult> GetUser()
        {
            return Ok(new UserDto());
        }

        [HttpPost("Register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(UserDto userDto)
        {
            try
            {
                //pego o Json que recebi como parametro e mapeio para User preenchendo só alguns campos dele
                var user = _mapper.Map<User>(userDto); 
                //pego o user com alguns campos preenchidos e registro ele no BD
                var result = await _userManager.CreateAsync(user, userDto.Password);
                //Assim que eu acabo de registrá-lo no BD eu pego o result (se eu tive sucesso)
                //Pego o user baseado no UserDto para retorno
                var userToReturn = _mapper.Map<UserDto>(user);

                if (result.Succeeded) //se eu tive sucesso na hora de inserir no BD
                {
                    return Created("GetUser", userToReturn);
                }

                //Se aconteceu algum problema e eu não consiga sucesso ao registrar no banco
                return BadRequest(result.Errors);
            }
            catch (System.Exception ex)
            {
                return this.StatusCode(StatusCodes.Status500InternalServerError, $"Banco Dados falhou {ex.Message}");
            }
        }

        [HttpPost("Login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(UserLoginDto userLogin)
        {
            try
            {
                //ver se existe no BD um usuario com esse nome
                var user = await _userManager.FindByNameAsync(userLogin.UserName);
                //uma vez encontrado o user confere a senha dele
                var result = await _signInManager.CheckPasswordSignInAsync(user, userLogin.Password, false);

                if (result.Succeeded)
                {
                    var appUser = await _userManager.Users
                        .FirstOrDefaultAsync(u => u.NormalizedUserName == userLogin.UserName.ToUpper());

                    var userToReturn = _mapper.Map<UserLoginDto>(appUser);

                    //gera o token baseado no usuario que foi encontrado pelo _userManager
                    return Ok(new {
                        token = GenerateJWToken(appUser).Result,
                        user = userToReturn
                    });
                }

                return Unauthorized();
            }
            catch (System.Exception ex)
            {
                return this.StatusCode(StatusCodes.Status500InternalServerError, $"Banco Dados falhou {ex.Message}");
            }
        }

        /*Como será montado o token que será passado ao usuário que será autenticado*/
        private async Task<string> GenerateJWToken(User user)
        {
            //reivindicação de determinadas autorizações pelo usuário que foi autenticado
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName)
            };

            //retornar quais os papeis que o usuario que fez o login possui
            var roles = await _userManager.GetRolesAsync(user);

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.ASCII
                            .GetBytes(_config.GetSection("AppSettings:Token").Value));

            //com qual chave eu vou criptografar: qual é o algoritmo
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(1), //expira em um dia
                SigningCredentials = creds
            };

            //manipulador de token
            var tokenHandler = new JwtSecurityTokenHandler();

            var token = tokenHandler.CreateToken(tokenDescriptor); //criar o token seguindo o descritor

            return tokenHandler.WriteToken(token);
        }
    }
}
/*Essa controller será responsável por usarmos todo o aparato do identity core*/