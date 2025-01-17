# Little Lambda

A mini Lambda calculus interpreter in JavaScript.  Supports function invocation, lambda, and let.

"let" is like Common Lisp's "let*". The assignments are done serially, not in parallel. 

* By Thomas Cowart
* http://tncow.art
* georgemcfly@gmail.com

* Based on LittleLisp Mary Rose Cook
* https://maryrosecook.com
* mary@maryrosecook.com

Thank you to Martin Tornwall for the implementation of let.

## Repl

```
$ node repl.js
```

## Some runnable programs

```lisp
(\ (x) (x x))
```

```lisp
(let ((TRUE (\\ (x y) x))
      (FALSE (\\ (x y) y))
      (AND (\\ (x y) (x y x))))
     (AND TRUE FALSE))
```
