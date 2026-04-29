import { styled } from '@linaria/react';

const StyledResponsiveTableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    margin: 0 -16px;
    padding: 0 16px;
    width: calc(100% + 32px);
  }
`;

export const CpqResponsiveTable = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <StyledResponsiveTableWrapper>{children}</StyledResponsiveTableWrapper>
);
