export function generateRandomAlphanumericString(length: number): string {
  const alphanumericCharacters = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
  ] as const;

  return [...Array(length)]
    .map(
      () =>
        alphanumericCharacters[
          Math.floor(Math.random() * alphanumericCharacters.length)
        ],
    )
    .join('');
}

export function generateEmail(uniqueValue?: string) {
  const textContent = 'Hello, text';
  const htmlContent = 'Hello, HTML';

  uniqueValue = uniqueValue ?? generateRandomAlphanumericString(9);

  return {
    mailOptions: {
      from: `admin-${uniqueValue}@application.local`,
      to: `user-${uniqueValue}@email.local`,
      subject: `Subject for email - ${uniqueValue}`,
    },
    html: {
      template: `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>
                  ${htmlContent}: {{ uniqueValue }}
                </mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `,
      variables: { uniqueValue },
    },
    text: {
      template: `${textContent}: {{ uniqueValue }}`,
      variables: { uniqueValue },
    },
    __: {
      uniqueValue,
      textContent,
      htmlContent,
    },
  };
}
