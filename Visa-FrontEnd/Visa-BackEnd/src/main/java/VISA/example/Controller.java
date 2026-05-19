package VISA.example;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/")
@CrossOrigin(origins = "*")

public class Controller {

    @GetMapping("/dados")
    public Map<String, String> retornarDados() {
        Map<String, String> dados = new HashMap<>();
        dados.put("nome", "Felipe");
        dados.put("status", "Conectado com o Spring Boot com sucesso!");
        return dados;
    }
}
