import React from 'react';
   import { ThemeProvider } from '@mui/material/styles';
   import Container from '@mui/material/Container';
   import theme from './theme';
   import ChatInterface from './components/ChatInterface';

   const App: React.FC = () => {
     return (
       <ThemeProvider theme={theme}>
         <Container maxWidth='lg' sx={{py:4}}>
           <ChatInterface />
         </Container>
       </ThemeProvider>
     );
   };

   export default App;