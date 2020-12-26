using System.ComponentModel.DataAnnotations;

namespace ProAgil.WebAPI.Dtos
{
    public class LoteDto
    {
        public int Id { get; set; }
        public string Nome { get; set; }

        [Required (ErrorMessage="O campo {0} é obrigatório")]
        public decimal Preço { get; set; }
        public string DataInicio { get; set; }
        public string DataFim { get; set; }

        [Range (2, 120000)]
        public int Quantidade { get; set; }
    }
}