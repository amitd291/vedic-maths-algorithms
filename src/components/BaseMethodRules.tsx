export default function BaseMethodRules() {
  return (
    <section className="method-rules">
      <hr className="section-divider" />
      <h2>Method rules</h2>
      <ol>
        <li>Base = nearest power of 10 to the divisor. Difference = base − divisor.</li>
        <li>
          Split the dividend: RHS gets as many digits as there are zeros in the base; the rest is
          the LHS (quotient region).
        </li>
        <li>Bring down each LHS digit left to right; it becomes (or contributes to) the quotient.</li>
        <li>
          Multiply each LHS digit&rsquo;s total by the difference. When the difference has several
          digits, write each digit diagonally under its own column, so one LHS digit can fan out
          across several columns to the right at once.
        </li>
        <li>
          Sum the RHS columns right to left, carrying overflow into the column to the left, to get
          the remainder.
        </li>
        <li>
          If the remainder is ≥ the divisor or negative, correct by ∓1 on the quotient and ±divisor
          on the remainder. A negative (Paravartya, base &lt; divisor) difference can leave a
          signed intermediate quotient digit; combine the signed digits by place value to get the
          final quotient.
        </li>
      </ol>
    </section>
  )
}
