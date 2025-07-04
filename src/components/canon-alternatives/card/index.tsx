import React from 'react';
import { createStyles, makeStyles, useTheme } from "@material-ui/core/styles";
import { Box, Flex, Heading } from "@backstage/canon";
import { Divider } from '@material-ui/core';

const useStyles = makeStyles(_ =>
  createStyles({
    "pagerduty-Card": {
      backgroundColor: "var(--canon-bg)",
      border: "1px solid var(--canon-border)",
      borderRadius: "var(--canon-radius-4)",
    },
    "pagerduty-CardDivider": {
      margin: "22px 0",
    },
    "pagerduty-CardContent": {
      padding: "22px var(--canon-space-8)",
    },
  })
);

const Card = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles();
  const theme = useTheme();

  return (
    <div data-theme={theme.palette.type} className={classes["pagerduty-Card"]}>
      <Box className={classes["pagerduty-CardContent"]}>
        {children}
      </Box>
    </div>
  );
}

const Header = ({ title, action, children }: { title: React.ReactNode, action?: React.ReactNode, children?: React.ReactNode }) => {
  const classes = useStyles();

  return (
    <Box>
      <Flex justify="between" mb={children ? "4" : "0"}>
        <Heading variant="title5">{title}</Heading>
        {action}
      </Flex>
      
      {children}

      <Divider className={classes["pagerduty-CardDivider"]} />
    </Box>
  )
};

Card.Header = Header;
export default Card;