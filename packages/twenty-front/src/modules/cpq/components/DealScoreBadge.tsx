import { styled } from '@linaria/react';

export type DealScoreLevel = 'A' | 'B' | 'C' | 'D' | 'F';

type DealScoreBadgeProps = {
  score: number; // 0–100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const SCORE_LEVEL = (score: number): DealScoreLevel => {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

const LEVEL_META: Record<DealScoreLevel, { label: string; color: string; bg: string; borderColor: string }> = {
  A: {
    label: 'Strong',
    color: '#166534',
    bg: '#dcfce7',
    borderColor: '#86efac',
  },
  B: {
    label: 'Good',
    color: '#1d4ed8',
    bg: '#dbeafe',
    borderColor: '#93c5fd',
  },
  C: {
    label: 'Fair',
    color: '#854d0e',
    bg: '#fef9c3',
    borderColor: '#fde047',
  },
  D: {
    label: 'Weak',
    color: '#9a3412',
    bg: '#ffedd5',
    borderColor: '#fdba74',
  },
  F: {
    label: 'At Risk',
    color: '#991b1b',
    bg: '#fee2e2',
    borderColor: '#fca5a5',
  },
};

const SIZE_STYLES = {
  sm: { fontSize: '10px', padding: '1px 5px', minWidth: '22px', letterSpacing: '0' },
  md: { fontSize: '11px', padding: '2px 7px', minWidth: '26px', letterSpacing: '0.01em' },
  lg: { fontSize: '13px', padding: '4px 10px', minWidth: '34px', letterSpacing: '0.01em' },
};

const StyledBadge = styled.div<{
  color: string;
  bg: string;
  borderColor: string;
  fontSize: string;
  padding: string;
  minWidth: string;
  letterSpacing: string;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: ${({ fontSize }) => fontSize};
  padding: ${({ padding }) => padding};
  min-width: ${({ minWidth }) => minWidth};
  border-radius: 4px;
  font-weight: 700;
  border: 1px solid ${({ borderColor }) => borderColor};
  background: ${({ bg }) => bg};
  color: ${({ color }) => color};
  letter-spacing: ${({ letterSpacing }) => letterSpacing};
  white-space: nowrap;
`;

// Deal health score badge. Score is 0–100; letter grade (A–F) is derived automatically.
// Used in pipeline table rows and deal detail cards.
export const DealScoreBadge = ({ score, showLabel = false, size = 'md' }: DealScoreBadgeProps) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const level = SCORE_LEVEL(clampedScore);
  const meta = LEVEL_META[level];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <StyledBadge
      color={meta.color}
      bg={meta.bg}
      borderColor={meta.borderColor}
      fontSize={sizeStyle.fontSize}
      padding={sizeStyle.padding}
      minWidth={sizeStyle.minWidth}
      letterSpacing={sizeStyle.letterSpacing}
      title={`Deal score: ${clampedScore}/100 — ${meta.label}`}
    >
      {level}
      {showLabel && <span style={{ fontWeight: 500 }}>{meta.label}</span>}
    </StyledBadge>
  );
};

type DealScoreBarProps = {
  score: number;
  width?: number;
};

const StyledBarTrack = styled.div`
  height: 6px;
  border-radius: 3px;
  background: var(--twentyborder-color);
  overflow: hidden;
  flex: 1;
`;

const StyledBarFill = styled.div<{ percent: number; level: DealScoreLevel }>`
  height: 100%;
  border-radius: 3px;
  width: ${({ percent }) => percent}%;
  background: ${({ level }) => {
    switch (level) {
      case 'A': return '#16a34a';
      case 'B': return '#2563eb';
      case 'C': return '#ca8a04';
      case 'D': return '#ea580c';
      case 'F': return '#dc2626';
    }
  }};
  transition: width 0.3s ease;
`;

const StyledBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Compact score bar for use in table cells or deal cards alongside the badge.
export const DealScoreBar = ({ score }: DealScoreBarProps) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const level = SCORE_LEVEL(clampedScore);

  return (
    <StyledBarRow>
      <DealScoreBadge score={clampedScore} size="sm" />
      <StyledBarTrack>
        <StyledBarFill percent={clampedScore} level={level} />
      </StyledBarTrack>
      <span style={{ fontSize: 11, color: 'var(--twentyfont-color-tertiary)', minWidth: 24 }}>
        {clampedScore}
      </span>
    </StyledBarRow>
  );
};
