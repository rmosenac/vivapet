"use client";

import { useState } from "react";

interface ItemDoacao {
    id_suprimento: number;
    quantidade: number;
    data_validade: string;
    nomeSuprimento?: string;
}

interface Doacao {
    id_doacao: number;
    id_doador: number;
    itens: ItemDoacao[];
    data_doacao: string;
}

interface DoadorResumo {
    id_doador: number;
    nome: string;
}

interface SuprimentoResumo {
    id_suprimento: number;
    nome: string;
}

export default function TelaDoacao() {
    const [idDoador, setIdDoador] = useState("");
    const [dataDoacao, setDataDoacao] = useState("");

    const [idSuprimentoSelecionado, setIdSuprimentoSelecionado] = useState("");
    const [quantidadeSelecionada, setQuantidadeSelecionada] = useState("");
    const [validadeSelecionada, setValidadeSelecionada] = useState("");
    const [itensDoacao, setItensDoacao] = useState<ItemDoacao[]>([]);

    const [doacoes, setDoacoes] = useState<Doacao[]>([]);
    const [doadoresLista, setDoadoresLista] = useState<DoadorResumo[]>([]);
    const [suprimentosLista, setSuprimentosLista] = useState<SuprimentoResumo[]>([]);
    const [mensagem, setMensagem] = useState("");

    const exibirMensagem = (texto: string) => {
        setMensagem(texto);
        setTimeout(() => {
            setMensagem("");
        }, 3000);
    };

    const adicionarItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!idSuprimentoSelecionado || !quantidadeSelecionada || !validadeSelecionada) {
            exibirMensagem("Preencha o suprimento, a quantidade e a validade!");
            return;
        }

        const suprimentoObj = suprimentosLista.find(s => s.id_suprimento === Number(idSuprimentoSelecionado));

        const novoItem: ItemDoacao = {
            id_suprimento: Number(idSuprimentoSelecionado),
            quantidade: Number(quantidadeSelecionada),
            data_validade: validadeSelecionada,
            nomeSuprimento: suprimentoObj ? suprimentoObj.nome : `Item ${idSuprimentoSelecionado}`
        };

        setItensDoacao([...itensDoacao, novoItem]);
        setIdSuprimentoSelecionado("");
        setQuantidadeSelecionada("");
        setValidadeSelecionada("");
    };

    const removerItem = (index: number) => {
        const novaLista = itensDoacao.filter((_, i) => i !== index);
        setItensDoacao(novaLista);
    };

    const salvarDoacao = async (e: React.FormEvent) => {
        e.preventDefault();

        if (itensDoacao.length === 0) {
            exibirMensagem("Adicione pelo menos um item à doação!");
            return;
        }

        setMensagem("Processando...");

        const payload = {
            id_doador: Number(idDoador),
            data_doacao: dataDoacao,
            itens: itensDoacao.map(({ id_suprimento, quantidade, data_validade }) => ({
                id_suprimento,
                quantidade,
                data_validade
            }))
        };

        try {
            const res = await fetch("/api/doacoes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const text = await res.text();
            const data = text ? JSON.parse(text) : {};

            if (res.ok) {
                exibirMensagem("Doação registrada com sucesso!");
                limparFormulario();
                carregarDadosGlobais();
            } else {
                exibirMensagem(`Erro ${res.status}: ${data.error || res.statusText}`);
            }
        } catch (error: unknown) {
            console.error("Falha na requisição:", error);
            const msgErro = error instanceof Error ? error.message : "Erro desconhecido";
            exibirMensagem(`Falha na comunicação: ${msgErro}`);
        }
    };

    const limparFormulario = () => {
        setIdDoador("");
        setDataDoacao("");
        setItensDoacao([]);
        setIdSuprimentoSelecionado("");
        setQuantidadeSelecionada("");
        setValidadeSelecionada("");
    };

    const carregarDadosGlobais = async () => {
        setMensagem("Carregando base de dados...");
        try {
            // 1. Carregar Doadores
            const resDoadores = await fetch("/api/doadores", { cache: "no-store" });
            if (resDoadores.ok) {
                const dataDoadores = await resDoadores.json();
                setDoadoresLista(Array.isArray(dataDoadores) ? dataDoadores.map((d: any) => ({
                    id_doador: d.id_doador ?? d._id_doador,
                    nome: d.nome ?? d._nome
                })) : []);
            }

            // 2. Carregar Suprimentos
            const resSuprimentos = await fetch("/api/suprimentos", { cache: "no-store" });
            if (resSuprimentos.ok) {
                const dataSuprimentos = await resSuprimentos.json();
                setSuprimentosLista(Array.isArray(dataSuprimentos) ? dataSuprimentos.map((s: any) => ({
                    id_suprimento: s.id_suprimento ?? s._id_suprimento,
                    nome: s.nome ?? s._nome
                })) : []);
            }

            // 3. Carregar Doações com tratamento isolado para identificar se o erro está aqui
            const resDoacoes = await fetch("/api/doacoes", { cache: "no-store" });
            if (resDoacoes.ok) {
                const dataDoacoes = await resDoacoes.json();
                const listaMapeada = Array.isArray(dataDoacoes) ? dataDoacoes.map((d: any) => ({
                    id_doacao: d.id_doacao ?? d._id_doacao ?? d.id,
                    id_doador: d.id_doador ?? d._id_doador,
                    itens: d.itens ?? d._itens ?? d.itensDoacao ?? [],
                    data_doacao: d.data_doacao ?? d._data_doacao ?? d.data
                })) : [];

                setDoacoes(listaMapeada);
                exibirMensagem(`Dados carregados com sucesso! (${listaMapeada.length} doações)`);
            } else {
                const errText = await res.text();
                console.error("Erro na rota de doações:", errText);
                exibirMensagem(`Aviso: Doadores/Suprimentos carregados, mas erro ao buscar doações (${res.status}).`);
            }
        } catch (error: unknown) {
            console.error("Falha ao carregar dados globais:", error);
            exibirMensagem("Falha na comunicação ao buscar doações.");
        }
    };

    const getNomeSuprimento = (id: number) => {
        const suprimento = suprimentosLista.find(s => s.id_suprimento === Number(id));
        return suprimento ? suprimento.nome : `Item ID ${id}`;
    };

    return (
        <div className="container">
            {mensagem && (
                <div className="alerta">
                    <strong>Aviso:</strong> {mensagem}
                </div>
            )}

            <div className="layout-duplo">
                <section className="coluna-form">
                    <h1 className="titulo-principal">Registro de Doações</h1>
                    <h2 className="subtitulo">Nova Doação</h2>

                    <form onSubmit={salvarDoacao} className="formulario">

                        <select
                            value={idDoador}
                            onChange={(e) => setIdDoador(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                {doadoresLista.length === 0 ? "Clique em 'Carregar Dados' abaixo..." : "Selecione o Doador"}
                            </option>
                            {doadoresLista.map((doador) => (
                                <option key={doador.id_doador} value={doador.id_doador}>
                                    {doador.nome}
                                </option>
                            ))}
                        </select>

                        <label style={{ fontSize: "0.9rem", color: "var(--texto-mutado)", marginBottom: "-10px" }}>
                            Data da Doação
                        </label>
                        <input
                            type="date"
                            value={dataDoacao}
                            onChange={(e) => setDataDoacao(e.target.value)}
                            required
                        />

                        {/* Bloco de Adição de Itens */}
                        <div style={{ border: "1px dashed var(--roxo-viva)", padding: "15px", borderRadius: "8px", marginTop: "5px" }}>
                            <h3 style={{ fontSize: "1rem", color: "var(--roxo-viva)", marginTop: 0, marginBottom: "10px" }}>
                                Itens da Doação
                            </h3>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>
                                <select
                                    value={idSuprimentoSelecionado}
                                    onChange={(e) => setIdSuprimentoSelecionado(e.target.value)}
                                >
                                    <option value="" disabled>Selecione o Suprimento</option>
                                    {suprimentosLista.map((suprimento) => (
                                        <option key={suprimento.id_suprimento} value={suprimento.id_suprimento}>
                                            {suprimento.nome}
                                        </option>
                                    ))}
                                </select>

                                <div style={{ display: "flex", gap: "10px" }}>
                                    <input
                                        type="number"
                                        placeholder="Qtd"
                                        value={quantidadeSelecionada}
                                        onChange={(e) => setQuantidadeSelecionada(e.target.value)}
                                        style={{ flex: 1 }}
                                        min="0.01"
                                        step="any"
                                    />

                                    <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--texto-mutado)", marginBottom: "2px" }}>Validade do Lote</span>
                                        <input
                                            type="date"
                                            value={validadeSelecionada}
                                            onChange={(e) => setValidadeSelecionada(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={adicionarItem}
                                    style={{
                                        backgroundColor: "var(--verde-viva)",
                                        color: "#144627",
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "10px",
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                        marginTop: "5px"
                                    }}
                                >
                                    + Adicionar Item à Doação
                                </button>
                            </div>

                            {itensDoacao.length === 0 ? (
                                <p style={{ fontSize: "0.85rem", color: "var(--texto-mutado)", fontStyle: "italic", margin: 0 }}>
                                    Nenhum item adicionado ainda.
                                </p>
                            ) : (
                                <ul style={{ paddingLeft: "20px", margin: "5px 0 0 0", fontSize: "0.85rem" }}>
                                    {itensDoacao.map((item, index) => {
                                        const validadeFormatada = item.data_validade
                                            ? new Date(item.data_validade).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                                            : '';

                                        return (
                                            <li key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
                                                <span>
                                                    {item.nomeSuprimento || getNomeSuprimento(item.id_suprimento)}: <strong>Qtd: {item.quantidade}</strong> (Val: {validadeFormatada})
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removerItem(index)}
                                                    style={{ background: "none", border: "none", color: "var(--coral-viva)", cursor: "pointer", fontWeight: "bold" }}
                                                >
                                                    ✕
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="botoes-form">
                            <button
                                type="submit"
                                className="botao"
                                disabled={doadoresLista.length === 0}
                            >
                                Registrar Doação
                            </button>
                        </div>
                    </form>
                </section>

                <section className="coluna-lista">
                    <h1 className="titulo-principal">Histórico de Doações</h1>

                    <div className="tabela-wrapper">
                        <table className="tabela">
                            <thead>
                                <tr className="tabela-cabecalho">
                                    <th>Cód.</th>
                                    <th>Itens Doados</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doacoes.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="tabela-vazia">
                                            Nenhuma doação carregada. Clique no botão abaixo.
                                        </td>
                                    </tr>
                                ) : (
                                    doacoes.map((d) => {
                                        const dataExibicao = d.data_doacao
                                            ? new Date(d.data_doacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                                            : 'N/A';

                                        return (
                                            <tr key={d.id_doacao}>
                                                <td>{d.id_doacao}</td>
                                                <td>
                                                    {d.itens && Array.isArray(d.itens) && d.itens.length > 0 ? (
                                                        <ul style={{ paddingLeft: "15px", margin: 0 }}>
                                                            {d.itens.map((it, idx) => {
                                                                const valItem = it.data_validade
                                                                    ? new Date(it.data_validade).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                                                                    : '';
                                                                return (
                                                                    <li key={idx}>
                                                                        {getNomeSuprimento(it.id_suprimento)}: <strong style={{ color: "var(--verde-viva)" }}>+{it.quantidade}</strong> {valItem ? `(Val: ${valItem})` : ''}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    ) : (
                                                        <span>Sem itens detalhados</span>
                                                    )}
                                                </td>
                                                <td>{dataExibicao}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <button onClick={carregarDadosGlobais} className="botao-atualizar">
                        Carregar Dados / Atualizar Tabela
                    </button>
                </section>
            </div>
        </div>
    );
}