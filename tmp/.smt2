
(declare-const x Int)
(assert (not (>= x  0 )))
(check-sat)
(get-value (x))
