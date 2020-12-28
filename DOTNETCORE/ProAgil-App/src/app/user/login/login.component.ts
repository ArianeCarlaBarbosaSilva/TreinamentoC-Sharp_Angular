import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  titulo = 'login';
  model: any = {};

  //colocado como public porque vai ser utilizado dentro do html
  constructor(private authService: AuthService, public router: Router, private toastr: ToastrService) { }

  ngOnInit() {
    if (localStorage.getItem('token') != null) {
      this.router.navigate(['/dashboard']);
    }
  }

  login() {
    this.authService.login(this.model).subscribe(
      () => {
        this.router.navigate(['dashboard']);
        this.toastr.success('Usuario logado com sucesso!');
      },
      error => {
        this.toastr.error('Falha ao tentar logar');
      }
    )
  }

}
