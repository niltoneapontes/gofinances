import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

import income from '../../assets/income.svg';
import outcome from '../../assets/outcome.svg';
import total from '../../assets/total.svg';

import api from '../../services/api';

import Header from '../../components/Header';

import formatValue from '../../utils/formatValue';

import { Container, CardContainer, Card, TableContainer } from './styles';

interface Transaction {
  id: string;
  title: string;
  value: number;
  formattedValue: string;
  formattedDate: string;
  type: 'income' | 'outcome';
  category: { title: string };
  created_at: Date;
}

interface RequestTransaction {
  id: string;
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category_id: string;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
  };
}

interface Balance {
  income: string;
  outcome: string;
  total: string;
}

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<Balance>({} as Balance);

  useEffect(() => {
    async function loadTransactions(): Promise<void> {
      await api.get('/transactions').then(response => {
        // setTransactions();
        const requestTransactions = response.data.transactions;
        const newTransactions = requestTransactions.map(
          (transaction: RequestTransaction) => ({
            id: transaction.id,
            title: transaction.title,
            value: transaction.value,
            formattedValue: formatValue(transaction.value),
            formattedDate: format(
              new Date(transaction.created_at),
              'dd/MM/yyyy',
            ),
            type: transaction.type,
            category: {
              title: transaction.category.title,
            },
            // eslint-disable-next-line @typescript-eslint/camelcase
            created_at: transaction.created_at,
          }),
        );
        setTransactions(newTransactions);
        setBalance(response.data.balance);
      });
    }
    loadTransactions();
  }, []);

  const formattedBalance = {
    income: formatValue(parseFloat(balance.income)),
    outcome: formatValue(parseFloat(balance.outcome)),
    total: formatValue(parseFloat(balance.total)),
  };

  return (
    <>
      <Header />
      <Container>
        <CardContainer>
          <Card>
            <header>
              <p>Entradas</p>
              <img src={income} alt="Income" />
            </header>
            <h1 data-testid="balance-income">{formattedBalance.income}</h1>
          </Card>
          <Card>
            <header>
              <p>Saídas</p>
              <img src={outcome} alt="Outcome" />
            </header>
            <h1 data-testid="balance-outcome">{formattedBalance.outcome}</h1>
          </Card>
          <Card total>
            <header>
              <p>Total</p>
              <img src={total} alt="Total" />
            </header>
            <h1 data-testid="balance-total">{formattedBalance.total}</h1>
          </Card>
        </CardContainer>

        <TableContainer>
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Preço</th>
                <th>Categoria</th>
                <th>Data</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td className="title">{transaction.title}</td>
                  <td className={transaction.type}>
                    {transaction.type === 'outcome'
                      ? `- ${transaction.formattedValue}`
                      : transaction.formattedValue}
                  </td>
                  <td>{transaction.category.title}</td>
                  <td>{transaction.formattedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableContainer>
      </Container>
    </>
  );
};

export default Dashboard;
