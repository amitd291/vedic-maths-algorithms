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
          Sum each RHS column's raw total as-is, even if it's ≥10 or negative — no carrying
          mid-pass. Only a closing step normalizes these into valid digits, right to left.
        </li>
        <li>
          If the resulting remainder is ≥ the divisor or negative, correct by ∓1 on the quotient
          and ±divisor on the remainder. A negative (Paravartya, base &lt; divisor) difference can
          leave a signed intermediate quotient digit; combine the signed digits by place value to
          get the final quotient. A Paravartya divisor can also exceed the base enough that the
          corrected remainder needs one more digit than the RHS has columns for (e.g. 1693 ÷ 131) —
          it's then shown as a single merged total rather than split across columns.
        </li>
      </ol>
    </section>
  )
}
