"use client";


/* EM MANUTENÇÃO */


import { useState } from "react";

interface Animal {
    id_animal: number;
    nome: string;
    tipo: string;
    raca: string;
    sexo: string;
    data_nascimento: string;
    data_entrada_abrigo: string;
    observacoes: string;
    status: string;
    id_cuidador: number;
}

export default function TelaAnimal() {
    const [nome, setNome] = useState("");
    const [tipo, setTipo] = useState("");
    const [raca, setRaca] = useState("");
    const [sexo, setSexo] = useState("");
    const [dataNascimento, setDataNascimento] = useState("");
    const [dataEntrada, setDataEntrada] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [status, setStatus] = useState("ATIVO");
    const [idCuidador, setIdCuidador] = useState("");

    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [animais, setAnimais] = useState<Animal[]>([]);
    const [mensagem, setMensagem] = useState("");

    const exibirMensagem = (texto: string) => {
        setMensagem(texto);
        setTimeout(() => {
            setMensagem("");
        }, 3000);
    };

    const salvarAnimal = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensagem("Processando...");

        try {
            if (editandoId) {
                // MODO EDIÇÃO: Conforme a Route do Backend, usamos PATCH
                // Apenas status e id_cuidador são enviados.
                const payloadPatch = {
                    status: status.trim().toUpperCase(),
                    id_cuidador: Number(idCuidador)
                };

                const res = await fetch(`/api/animais/${editandoId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payloadPatch),
                });

                const text = await res.text();
                const data = text ? JSON.parse(text) : {};

                if (res.ok) {
                    exibirMensagem("Status do animal atualizado com sucesso!");
                    limparFormulario();
                    carregarLista();
                } else {
                    exibirMensagem(`Erro ${res.status}: ${data.error || res.statusText}`);
                }

            } else {
                // MODO CRIAÇÃO: Usamos POST com todos os campos
                // Garantimos a formatação exata que a Check Constraint do DB exige
                const payloadPost = {
                    nome: nome.trim(),
                    tipo: tipo.trim().toUpperCase(),
                    raca: raca.trim(),
                    sexo: sexo.trim().toUpperCase(),
                    data_nascimento: dataNascimento,
                    data_entrada_abrigo: dataEntrada,
                    observacoes: observacoes.trim(),
                    status: status.trim().toUpperCase(),
                    id_cuidador: Number(idCuidador)
                };

                const res = await fetch("/api/animais", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payloadPost),
                });

                const text = await res.text();
                const data = text ? JSON.parse(text) : {};

                if (res.ok) {
                    exibirMensagem("Animal cadastrado com sucesso!");
                    limparFormulario();
                    carregarLista();
                } else {
                    exibirMensagem(`Erro ${res.status}: ${data.error || res.statusText}`);
                }
            }
        } catch (error: unknown) {
            console.error("Falha na requisição:", error);
            const msgErro = error instanceof Error ? error.message : "Erro desconhecido";
            exibirMensagem(`Falha na comunicação com o servidor: ${msgErro}`);
        }
    };

    const iniciarEdicao = (animal: Animal) => {
        setEditandoId(animal.id_animal);
        setNome(animal.nome);
        setTipo(animal.tipo);
        setRaca(animal.raca);
        setSexo(animal.sexo);
        setObservacoes(animal.observacoes || "");
        setStatus(animal.status);
        setIdCuidador(animal.id_cuidador.toString());

        const dataNascFormatada = animal.data_nascimento ? animal.data_nascimento.split('T')[0] : "";
        setDataNascimento(dataNascFormatada);

        const dataEntradaFormatada = animal.data_entrada_abrigo ? animal.data_entrada_abrigo.split('T')[0] : "";
        setDataEntrada(dataEntradaFormatada);
    };

    const limparFormulario = () => {
        setEditandoId(null);
        setNome("");
        setTipo("");
        setRaca("");
        setSexo("");
        setDataNascimento("");
        setDataEntrada("");
        setObservacoes("");
        setStatus("ATIVO");
        setIdCuidador("");
    };

    const carregarLista = async () => {
        setMensagem("Buscando animais...");
        try {
            const res = await fetch("/api/animais", {
                cache: "no-store"
            });

            const text = await res.text();
            const data = text ? JSON.parse(text) : {};

            if (res.ok) {
                const listaMapeada = Array.isArray(data) ? data.map((a: any) => ({
                    id_animal: a.id_animal || a._id_animal,
                    nome: a.nome || a._nome,
                    tipo: a.tipo || a._tipo,
                    raca: a.raca || a._raca,
                    sexo: a.sexo || a._sexo,
                    data_nascimento: a.data_nascimento || a._data_nascimento,
                    data_entrada_abrigo: a.data_entrada_abrigo || a._data_entrada_abrigo,
                    observacoes: a.observacoes || a._observacoes,
                    status: a.status || a._status,
                    id_cuidador: a.id_cuidador || a._id_cuidador
                })) : [];

                setAnimais(listaMapeada);
                exibirMensagem("Lista atualizada!");
            } else {
                exibirMensagem(`Erro: ${data.error || "Falha na busca"}`);
            }
        } catch (error: unknown) {
            console.error("Falha na requisição de busca:", error);
            const msgErro = error instanceof Error ? error.message : "Erro desconhecido";
            exibirMensagem(`Falha ao buscar os dados: ${msgErro}`);
        }
    };

    // Deixa a tabela visualmente elegante ("FEMEA" -> "Fêmea")
    const formatarTexto = (texto: string) => {
        if (!texto) return "";
        if (texto === "FEMEA") return "Fêmea";
        if (texto === "EM_ADOCAO") return "Em Adoção";
        return texto.charAt(0) + texto.slice(1).toLowerCase();
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
                    <h1 className="titulo-principal">Gestão de Animais</h1>
                    <h2 className="subtitulo">{editandoId ? "Editar Status do Animal" : "Cadastrar Novo"}</h2>

                    <form onSubmit={salvarAnimal} className="formulario">
                        <input
                            type="text"
                            placeholder="Nome do animal"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            disabled={editandoId !== null}
                        />

                        <select
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                            required
                            disabled={editandoId !== null}
                        >
                            <option value="" disabled>Selecione o Tipo</option>
                            <option value="CACHORRO">Cachorro</option>
                            <option value="GATO">Gato</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Raça (ex: SRD, Poodle)"
                            value={raca}
                            onChange={(e) => setRaca(e.target.value)}
                            required
                            disabled={editandoId !== null}
                        />

                        <select
                            value={sexo}
                            onChange={(e) => setSexo(e.target.value)}
                            required
                            disabled={editandoId !== null}
                        >
                            <option value="" disabled>Selecione o Sexo</option>
                            <option value="MACHO">Macho</option>
                            <option value="FEMEA">Fêmea</option>
                        </select>

                        <label style={{ fontSize: "0.9rem", color: "var(--texto-mutado)", marginBottom: "-10px" }}>
                            Data de Nascimento (Aproximada)
                        </label>
                        <input
                            type="date"
                            value={dataNascimento}
                            onChange={(e) => setDataNascimento(e.target.value)}
                            required
                            disabled={editandoId !== null}
                        />

                        <label style={{ fontSize: "0.9rem", color: "var(--texto-mutado)", marginBottom: "-10px" }}>
                            Data de Entrada no Abrigo
                        </label>
                        <input
                            type="date"
                            value={dataEntrada}
                            onChange={(e) => setDataEntrada(e.target.value)}
                            required
                            disabled={editandoId !== null}
                        />

                        <input
                            type="text"
                            placeholder="Observações de saúde/comportamento"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            disabled={editandoId !== null}
                        />

                        {/* Estes dois campos permanecem editáveis para o PATCH */}
                        <input
                            type="number"
                            placeholder="ID do Cuidador Responsável"
                            value={idCuidador}
                            onChange={(e) => setIdCuidador(e.target.value)}
                            required
                            min="1"
                            title="O ID do cuidador é necessário mesmo na atualização"
                        />

                        {editandoId && (
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="ATIVO">Status: No Abrigo (Ativo)</option>
                                <option value="EM_ADOCAO">Status: Em Processo de Adoção</option>
                                <option value="ADOTADO">Status: Adotado</option>
                                <option value="FALECIDO">Status: Falecido</option>
                            </select>
                        )}

                        <div className="botoes-form">
                            <button type="submit" className="botao">
                                {editandoId ? "Atualizar Status" : "Salvar Animal"}
                            </button>
                            {editandoId && (
                                <button type="button" onClick={limparFormulario} className="botao-cancelar">
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="coluna-lista">
                    <h1 className="titulo-principal">Lista de Animais</h1>

                    <div className="tabela-wrapper">
                        <table className="tabela">
                            <thead>
                                <tr className="tabela-cabecalho">
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Tipo</th>
                                    <th>Raça</th>
                                    <th>Sexo</th>
                                    <th>Entrada</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {animais.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="tabela-vazia">
                                            Nenhum animal carregado. Clique no botão abaixo.
                                        </td>
                                    </tr>
                                ) : (
                                    animais.map((a) => {
                                        const dataExibicao = a.data_entrada_abrigo
                                            ? new Date(a.data_entrada_abrigo).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                                            : 'N/A';

                                        return (
                                            <tr key={a.id_animal}>
                                                <td>{a.id_animal}</td>
                                                <td>{a.nome}</td>
                                                <td>{formatarTexto(a.tipo)}</td>
                                                <td>{a.raca}</td>
                                                <td>{formatarTexto(a.sexo)}</td>
                                                <td>{dataExibicao}</td>
                                                <td>
                                                    <span style={{
                                                        fontWeight: "600",
                                                        color: a.status === 'ATIVO' ? 'var(--verde-viva)' : 'inherit'
                                                    }}>
                                                        {formatarTexto(a.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button onClick={() => iniciarEdicao(a)} className="botao-editar">
                                                        Editar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <button onClick={carregarLista} className="botao-atualizar">
                        Carregar / Atualizar Tabela
                    </button>
                </section>
            </div>
        </div>
    );
}