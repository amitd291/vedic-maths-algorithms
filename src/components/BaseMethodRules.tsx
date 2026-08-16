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
          Multiply each column&rsquo;s total by the difference and write the product diagonally
          under the next column to the right.
        </li>
        <li>Sum each column top-to-bottom to get the next LHS digit or a remainder component.</li>
      </ol>
    </section>
  )
}
