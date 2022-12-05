import { css, cx, stack } from '../../src';
import type { Meta } from '@storybook/react';

const meta: Meta = {
  title: 'Styled System / Examples',
};

export function Stack() {
  return (
    <div>
      <div
        className={cx(
          stack({
            direction: { xs: 'column', md: 'row' },
            gap: { xs: '4', md: '12' },
          }),
          css({ background: { light: 'red.400' }, padding: '4' }),
        )}
      >
        <span
          className={css({
            fontSize: '16',
            background: 'white',
            paddingX: '12',
          })}
        >
          1
        </span>
        <span
          className={css({
            fontSize: '16',
            background: 'white',
            paddingX: '12',
          })}
        >
          2
        </span>
      </div>
    </div>
  );
}

export default meta;
