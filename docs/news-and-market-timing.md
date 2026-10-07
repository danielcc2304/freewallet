# News editing and Market Timing challenge

## News articles

Published articles no longer have the duplicate top and bottom news links. A fixed, accessible pencil links to the existing editor with the article prefilled. It appears only for the verified, signed-in author who still has editorial access. Public reading stays available if authentication fails or the user signs out. Existing server authorization is unchanged.

`test:news-article-editor-ui` uses isolated auth and article fixtures to check guests, other editors, revoked access, mismatched identity, authorless posts, author editing, mobile/themes, logout and preservation of publication date and attribution. No live editorial data is modified.

## Market Timing vs DCA

The previous simulation pulled prices back toward 100 and excluded uninvested DCA cash from the comparison. The redesigned challenge uses three independent simulated markets with changing upward/downward trends, volatility and occasional gaps. Prices are generated before play, independently of the player's orders, and only elapsed sessions are displayed.

Each round lasts 30 seconds, compresses 75 sessions and gives both strategies €10,000. DCA invests ten €1,000 budgets at sessions 0, 8, …, 72. Manual orders can use 25%, 50% or 100% of remaining cash/holdings; they execute two sessions later, allow four sessions of cooldown and are limited to eight per round. Both strategies pay 0.15% commission and a 0.10% spread. Budgeted purchases include commission. Portfolio values include remaining cash and marked holdings; the end does not force a sale.

The challenge requires at least two winning rounds and €100 accumulated advantage. Winning rounds require an advantage above €1 to avoid counting rounding noise. Round results retain the chart and show costs, maximum drawdown and accumulated results. Pause, tab visibility and keyboard controls freeze/resume the same market; a new challenge resets balances, results and random seed.

`test:market-timing` checks financial calculations, delayed execution at the fill price, duplicate clicks, partial trades, cooldown/order limits, DCA cash, future-price visibility, round transitions, risk and scoring. `test:market-timing-ui` checks mobile dimensions, themes, controls, execution, pause/tab visibility, all three rounds and restart in a local browser with external requests blocked.

As a tuning check over 500 reproducible challenges, staying in cash won 185 and buying once at the start won 225. This is a property of this synthetic sample, not evidence about real-world investment strategies. The game does not force a DCA win and its result text makes no claim that DCA always outperforms.
