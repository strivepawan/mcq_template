import { OptionId, LanguageCode, MCQItem, ParsedMCQRow, CSVImportResult } from '../types/mcq';

export class CSVParserService {
  /**
   * Parse CSV string into structured lines respecting quotes and newlines
   */
  public parseCSVString(csvText: string): string[][] {
    // Strip UTF-8 BOM if present
    const cleanText = csvText.replace(/^\uFEFF/, '').trim();
    if (!cleanText) return [];

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip LF in CRLF
        }
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentCell += char;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * Intelligent Header Matcher to find column indexes
   */
  private matchHeaderColumn(headers: string[], aliases: string[]): number {
    const normalizedHeaders = headers.map((h) =>
      h.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '')
    );
    for (const alias of aliases) {
      const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
      const idx = normalizedHeaders.findIndex((h) => h === cleanAlias || h.includes(cleanAlias));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  /**
   * Auto-detect if text is primarily Hindi (Devanagari Unicode)
   */
  public detectLanguage(text: string): LanguageCode {
    const devanagariRegex = /[\u0900-\u097F]/;
    return devanagariRegex.test(text) ? 'hi' : 'en';
  }

  /**
   * Parse uploaded CSV file content into validated MCQ rows
   */
  public parseMCQCSV(csvContent: string, fileName = 'uploaded.csv'): CSVImportResult {
    const grid = this.parseCSVString(csvContent);
    if (grid.length === 0) {
      return {
        fileName,
        rows: [],
        totalParsed: 0,
        validCount: 0,
        invalidCount: 0
      };
    }

    // First row is assumed to be headers
    const rawHeaders = grid[0];
    const dataRows = grid.slice(1);

    // Map column indices
    const qCol = this.matchHeaderColumn(rawHeaders, ['question', 'प्रश्न', 'q', 'quiz', 'prompt', 'title']);
    const aCol = this.matchHeaderColumn(rawHeaders, ['optiona', 'option_a', 'option a', 'a', 'विकल्प a', 'विकल्प क', 'choice a', 'opt a']);
    const bCol = this.matchHeaderColumn(rawHeaders, ['optionb', 'option_b', 'option b', 'b', 'विकल्प b', 'विकल्प ख', 'choice b', 'opt b']);
    const cCol = this.matchHeaderColumn(rawHeaders, ['optionc', 'option_c', 'option c', 'c', 'विकल्प c', 'विकल्प ग', 'choice c', 'opt c']);
    const dCol = this.matchHeaderColumn(rawHeaders, ['optiond', 'option_d', 'option d', 'd', 'विकल्प d', 'विकल्प घ', 'choice d', 'opt d']);
    const ansCol = this.matchHeaderColumn(rawHeaders, ['correctanswer', 'correct_answer', 'correct answer', 'answer', 'ans', 'उत्तर', 'correct', 'key']);
    const expCol = this.matchHeaderColumn(rawHeaders, ['explanation', 'explain', 'स्पष्टीकरण', 'solution', 'reason', 'why']);
    const catCol = this.matchHeaderColumn(rawHeaders, ['category', 'श्रेणी', 'subject', 'topic', 'tag', 'cat']);
    const diffCol = this.matchHeaderColumn(rawHeaders, ['difficulty', 'कठिनाई', 'level', 'diff']);
    const langCol = this.matchHeaderColumn(rawHeaders, ['language', 'भाषा', 'lang']);
    const timerCol = this.matchHeaderColumn(rawHeaders, ['timer', 'waittime', 'wait_time', 'seconds', 'time']);

    // Fallback column positions if headers didn't match standard names (assume 0=Q, 1=A, 2=B, 3=C, 4=D, 5=Ans)
    const idxQ = qCol !== -1 ? qCol : 0;
    const idxA = aCol !== -1 ? aCol : 1;
    const idxB = bCol !== -1 ? bCol : 2;
    const idxC = cCol !== -1 ? cCol : 3;
    const idxD = dCol !== -1 ? dCol : 4;
    const idxAns = ansCol !== -1 ? ansCol : 5;

    const parsedRows: ParsedMCQRow[] = [];

    dataRows.forEach((row, rowIndex) => {
      // Ignore empty rows
      if (row.length === 0 || row.every((cell) => !cell || cell.trim() === '')) {
        return;
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      const question = (row[idxQ] || '').trim();
      const optA = (row[idxA] || '').trim();
      const optB = (row[idxB] || '').trim();
      const optC = (row[idxC] || '').trim();
      const optD = (row[idxD] || '').trim();
      const rawAns = (row[idxAns] || '').trim();

      const explanation = expCol !== -1 && row[expCol] ? row[expCol].trim() : '';
      const category = catCol !== -1 && row[catCol] ? row[catCol].trim() : 'General';
      const rawDifficulty = diffCol !== -1 && row[diffCol] ? row[diffCol].trim() : 'Medium';
      const rawLang = langCol !== -1 && row[langCol] ? row[langCol].trim().toLowerCase() : '';
      const rawTimer = timerCol !== -1 && row[timerCol] ? parseInt(row[timerCol].trim(), 10) : 3;

      // Validation
      if (!question) {
        errors.push('Question text is missing.');
      }
      if (!optA) errors.push('Option A is missing.');
      if (!optB) errors.push('Option B is missing.');
      if (!optC) errors.push('Option C is missing.');
      if (!optD) errors.push('Option D is missing.');

      // Normalize Correct Answer
      let correctAnswer: OptionId = 'A';
      const cleanAns = rawAns.toUpperCase().trim();

      if (cleanAns === 'A' || cleanAns === '1' || cleanAns === 'OPTION A' || cleanAns === 'विकल्प A' || cleanAns === optA.toUpperCase()) {
        correctAnswer = 'A';
      } else if (cleanAns === 'B' || cleanAns === '2' || cleanAns === 'OPTION B' || cleanAns === 'विकल्प B' || cleanAns === optB.toUpperCase()) {
        correctAnswer = 'B';
      } else if (cleanAns === 'C' || cleanAns === '3' || cleanAns === 'OPTION C' || cleanAns === 'विकल्प C' || cleanAns === optC.toUpperCase()) {
        correctAnswer = 'C';
      } else if (cleanAns === 'D' || cleanAns === '4' || cleanAns === 'OPTION D' || cleanAns === 'विकल्प D' || cleanAns === optD.toUpperCase()) {
        correctAnswer = 'D';
      } else if (!rawAns) {
        errors.push('Correct answer is missing (must be A, B, C, or D).');
      } else {
        warnings.push(`Answer "${rawAns}" was ambiguous; defaulted to Option A.`);
      }

      // Normalize Difficulty
      let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
      if (/easy|सरल|आसान|1/i.test(rawDifficulty)) difficulty = 'Easy';
      else if (/hard|कठिन|मुश्किल|3/i.test(rawDifficulty)) difficulty = 'Hard';

      // Normalize Language
      let language: LanguageCode = 'en';
      if (rawLang === 'hi' || rawLang === 'hindi' || rawLang === 'हिंदी') {
        language = 'hi';
      } else if (rawLang === 'en' || rawLang === 'english') {
        language = 'en';
      } else {
        language = this.detectLanguage(question + optA + optB);
      }

      const waitTimeSeconds = !isNaN(rawTimer) && rawTimer >= 1 && rawTimer <= 10 ? rawTimer : 3;

      parsedRows.push({
        index: rowIndex + 1,
        question,
        options: [optA, optB, optC, optD],
        correctAnswer,
        explanation,
        category,
        difficulty,
        language,
        waitTimeSeconds,
        isValid: errors.length === 0,
        errors,
        warnings
      });
    });

    const validCount = parsedRows.filter((r) => r.isValid).length;
    const invalidCount = parsedRows.length - validCount;

    return {
      fileName,
      rows: parsedRows,
      totalParsed: parsedRows.length,
      validCount,
      invalidCount
    };
  }

  /**
   * Convert parsed CSV rows into MCQItem array
   */
  public parsedRowsToMCQItems(
    rows: ParsedMCQRow[],
    projectId: string,
    defaultVoiceover = true
  ): MCQItem[] {
    const timestamp = Date.now();
    return rows
      .filter((r) => r.isValid)
      .map((r, idx) => {
        const isHindi = r.language === 'hi';
        const defaultVoice = isHindi ? 'hi-IN-SwaraNeural' : 'en-US-JennyNeural';

        return {
          id: `mcq-bulk-${timestamp}-${idx}`,
          projectId,
          question: r.question,
          options: [
            { id: 'A', text: r.options[0] },
            { id: 'B', text: r.options[1] },
            { id: 'C', text: r.options[2] },
            { id: 'D', text: r.options[3] }
          ],
          correctAnswer: r.correctAnswer,
          waitTimeSeconds: r.waitTimeSeconds || 3,
          explanation: r.explanation,
          category: r.category || (isHindi ? 'सामान्य ज्ञान' : 'General'),
          difficulty: r.difficulty || 'Medium',
          language: r.language,
          voiceoverEnabled: defaultVoiceover,
          voiceName: defaultVoice,
          voiceRate: 1.0,
          voicePitch: 1.0,
          createdAt: timestamp + idx,
          updatedAt: timestamp + idx
        };
      });
  }

  /**
   * Generates downloadable Sample CSV content for English
   */
  public getEnglishSampleCSV(): string {
    return [
      'Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Category,Difficulty,Timer',
      '"Which planet in our solar system is known as the \\"Red Planet\\"?","Venus","Mars","Jupiter","Mercury","B","Mars appears red because of iron oxide minerals on its surface.","Astronomy","Easy","3"',
      '"What is the chemical symbol for Gold in the Periodic Table?","Ag","Au","Gd","Fe","B","Au comes from the Latin word Aurum meaning shining dawn.","Science","Medium","3"',
      '"Which is the largest desert on Earth by total surface area?","Sahara Desert","Arabian Desert","Antarctic Desert","Gobi Desert","C","Antarctica is a polar desert with 14.2M sq km total area.","Geography","Hard","3"',
      '"In which year did Apollo 11 land humans on the Moon?","1965","1969","1971","1975","B","Neil Armstrong and Buzz Aldrin landed on July 20 1969.","History","Medium","3"',
      '"What is the capital city of Australia?","Sydney","Melbourne","Canberra","Brisbane","C","Canberra was chosen as a compromise between Sydney and Melbourne.","Geography","Easy","3"'
    ].join('\n');
  }

  /**
   * Generates downloadable Sample CSV content for Hindi
   */
  public getHindiSampleCSV(): string {
    return [
      'Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation,Category,Difficulty,Timer',
      '"मानव शरीर की सबसे बड़ी ग्रंथि (Largest Gland) कौन सी है?","अग्न्याशय","यकृत (Liver)","थायरॉयड","पीयूष ग्रंथि","B","यकृत मानव शरीर की सबसे बड़ी आंतरिक ग्रंथि है।","सामान्य विज्ञान","Medium","3"',
      '"भारतीय संविधान के जनक के रूप में किसे जाना जाता है?","महात्मा गांधी","डॉ. भीमराव अंबेडकर","पंडित जवाहरलाल नेहरू","सरदार वल्लभभाई पटेल","B","डॉ. बी.आर. अंबेडकर संविधान प्रारूप समिति के अध्यक्ष थे।","भारतीय संविधान","Easy","3"',
      '"भारत की सबसे लंबी नदी कौन सी है?","यमुना नदी","गंगा नदी","गोदावरी नदी","ब्रह्मपुत्र नदी","B","गंगा नदी की कुल लंबाई लगभग 2525 किलोमीटर है।","भारत का भूगोल","Easy","3"',
      '"सिंधु घाटी सभ्यता का प्रमुख बंदरगाह नगर कौन सा था?","कालीबंगा","लोथल","हड़प्पा","मोहनजोदड़ो","B","लोथल गुजरात में स्थित सिंधु सभ्यता का एक प्रसिद्ध बंदरगाह था।","भारतीय इतिहास","Medium","3"',
      '"सौरमंडल का सबसे बड़ा ग्रह कौन सा है?","शनि","बृहस्पति (Jupiter)","पृथ्वी","मंगल","B","बृहस्पति हमारे सौरमंडल का सबसे विशाल ग्रह है।","सौर मंडल","Easy","3"'
    ].join('\n');
  }

  /**
   * Browser file download helper
   */
  public downloadSampleCSV(language: LanguageCode = 'en'): void {
    const isHindi = language === 'hi';
    const csvContent = isHindi ? this.getHindiSampleCSV() : this.getEnglishSampleCSV();
    const fileName = isHindi ? 'quiz_template_hindi.csv' : 'quiz_template_english.csv';

    // Add BOM for correct UTF-8 rendering in Microsoft Excel (especially Hindi Devanagari)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}

export const csvParserService = new CSVParserService();
