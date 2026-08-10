export default function MethodRules() {
  return (
    <section className="method-rules">
      <hr className="section-divider" />
      <h2>Method rules</h2>
      <ol>
        <li>Split divisor — first digit = working divisor, rest = flag digit(s)</li>
        <li>Gross dividend (GD) = carry × 10 + next digit</li>
        <li>Net dividend (ND) = GD − (flag × previous Q digit)</li>
        <li>
          Before fixing a quotient digit, check ahead: if it would make the <em>next</em> digit's
          ND go negative, reduce this quotient digit by 1 and add the working divisor back into
          its carry — repeat until the next ND would be non-negative
        </li>
        <li>
          Quotient digit = ND ÷ working, carry = ND mod working — except on the last dividend
          digit, where ND is the answer's remainder instead of being divided again
        </li>
      </ol>
    </section>
  )
}
