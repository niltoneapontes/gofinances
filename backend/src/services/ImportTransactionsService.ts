import csvParse from 'csv-parse';
import fs from 'fs';
import { In, getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const contactsReadStream = fs.createReadStream(filePath); // indica qual o caminho do(s) arquivo(s) que deve(m) ser lido(s)

    const parsers = csvParse({
      // instancia o csv-parse com as configurações necessárias
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers); // lendo as linhas conforme disponibilidades/ordem

    const transactions: CSVTransaction[] = []; // estamos fazendo um "bulk insert". Salvamos os dados de uma vez só
    const categories: string[] = []; // assim evitamos de fazer MUITAS conexões com o DB.

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map(
        (cell: string) => cell.trim(), // tirar os espaços
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
