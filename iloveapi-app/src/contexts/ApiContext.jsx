import React, { createContext, useReducer } from 'react';
import axios from 'axios';

const ApiContext = createContext();

const initialState = {
  loading: false,
  error: null,
  data: null,
};

function apiReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, data: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export const ApiProvider = ({ children }) => {
  const [state, dispatch] = useReducer(apiReducer, initialState);

  const fetchData = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const response = await axios.get('https://v2.jokeapi.dev/joke/Any');
      dispatch({ type: 'FETCH_SUCCESS', payload: response.data });
    } catch (err) {
      console.error(err);
      dispatch({
        type: 'FETCH_ERROR',
        payload: 'Erro ao carregar dados.',
      });
    }
  };

  return (
    <ApiContext.Provider value={{ state, fetchData }}>
      {children}
    </ApiContext.Provider>
  );
};

export default ApiContext;
