import React, { Children, createContext, useReducer} from "react";
import axios from 'axios';

const CepContext = createContext();

const initialState = {
    loading: false,
    error: null,
    data: null,
};

function cepReducer(state, action) {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: null, data: null};
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, data: action.payload};
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: action.payload}; 
        default:
            return state;       
            
    }
}

export const CepProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cepReducer, initialState);

  const fetchCep = async (cep) => {
    if (!cep) {
      dispatch({ type: 'FETCH_ERROR', payload: 'O campo CEP é obrigatório.' });
      return;
    }

    dispatch({type:'FECH_START'});

    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      dispatch({ type: 'FETCH_SUCCESS', payload: response.data });
    } catch (err) {
      console.error(err);
      dispatch({ type: 'FETCH_ERROR', payload: 'CEP não encontrado ou inválido.' });
    }
  };

  return (
    <CepContext.Provider value={{ state, fetchCep }}>
      {children}
    </CepContext.Provider>
  );
};

export default CepContext;