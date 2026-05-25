package VISA.example;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api")
@CrossOrigin("*")
public class LoginController {
    
    @PostMapping("/login")
    public String login(@RequestBody loginDTO dados) {
    
        if(dados.getEmail().equals("analista@vigilancia.pr") && dados.getSenha().equals("123456")){
            return "LOGIN_OK";
        }
        
        return "LOGIN_ERRO";
    }
    
}
