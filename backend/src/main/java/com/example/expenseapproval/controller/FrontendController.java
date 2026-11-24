package com.example.expenseapproval.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendController {
    @GetMapping({"/login", "/requests", "/requests/new", "/requests/{id}", "/rules"})
    public String frontend() {
        return "forward:/index.html";
    }
}
