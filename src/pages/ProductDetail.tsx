// src/pages/ProductDetail.tsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, ArrowLeft, Medal, Trophy, Check } from "lucide-react";
import { Product, DEFAULT_PRODUCT_COLORS, CartItem as CartItemType, SpecificationItem } from "@/types/Product";
import { toast } from "sonner";
import { getProductById, getProductsByCategory } from "@/services/productsService";

// Função addToCart (conforme corrigida anteriormente)
const addToCart = (product: Product, quantity: number = 1, customName?: string, customModality?: string, selectedColor?: string) => {
  let cartItems: CartItemType[] = [];
  try {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      cartItems = JSON.parse(storedCart);
    }
  } catch (e) {
    console.error("Error parsing cart from localStorage", e);
    localStorage.removeItem("cart");
  }

  const existingItemIndex = cartItems.findIndex(
    (item: CartItemType) =>
      item.productId === product.id &&
      item.customName === customName &&
      item.customModality === customModality &&
      item.selectedColor === selectedColor
  );

  if (existingItemIndex !== -1) {
    cartItems[existingItemIndex].quantity += quantity;
  } else {
    const newItem: CartItemType = {
      productId: product.id,
      quantity,
      product,
      customName,
      customModality,
      selectedColor
    };
    cartItems.push(newItem);
  }

  try {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    window.dispatchEvent(new Event('storage')); // Dispara evento para atualizar outros componentes ouvindo o storage
  } catch (error) {
    console.error('[ProductDetail] Error saving to localStorage:', error);
    toast.error("Erro ao salvar o carrinho no localStorage.");
  }
};

const AVAILABLE_COLORS_MAP: { [key: string]: string } = {
  "#FFD700": "Dourado",
  "#C0C0C0": "Prata",
  "#CD7F32": "Bronze",
  "#000000": "Preto",
  "#0000FF": "Azul",
  "#FF0000": "Vermelho",
  '#3F2D21': "Amadeirado Escuro",
  '#D4C7B7': "Amadeirado Claro",
  '#008000': "Verde",
  '#FFFF00': "Amarelo",
  '#800080': "Roxo",
  '#FFA500': "Laranja",
};

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [customName, setCustomName] = useState("");
  const [customModality, setCustomModality] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      setLoading(true);
      setCustomName(""); // Reseta campos de personalização ao mudar de produto
      setCustomModality("");
      setSelectedColor("");
      try {
        const foundProduct = await getProductById(productId || "");
        // console.log("Produto carregado em ProductDetail:", foundProduct); // Para depuração
        setProduct(foundProduct);

        if (foundProduct) {
          const related = await getProductsByCategory(foundProduct.category);
          setRelatedProducts(related.filter(p => p.id !== foundProduct.id).slice(0, 2));

          const colorsToUse = (foundProduct.colors && foundProduct.colors.length > 0)
            ? foundProduct.colors
            : DEFAULT_PRODUCT_COLORS;

          if (colorsToUse.length > 0) {
            setSelectedColor(colorsToUse[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching product or related products:", error);
        toast.error("Erro ao carregar detalhes do produto.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductAndRelated();
    }
  }, [productId]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (product && newQuantity > product.stock) {
      toast.error(`Apenas ${product.stock} unidades disponíveis`);
      return;
    }
    setQuantity(newQuantity);
  };

  const handleAddToCartInternal = () => {
    if (product) {
      const colorToSave = (product.allowCustomization && displayProductColors.length > 0)
        ? selectedColor
        : undefined;

      addToCart(
        product,
        quantity,
        product.allowCustomization ? customName : undefined,
        product.allowCustomization ? customModality : undefined,
        colorToSave
      );
      toast.success(`${quantity} ${product.name} adicionado(s) ao carrinho!`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando produto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container flex-grow flex items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-2">Produto não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              O produto que você está procurando não existe ou foi removido.
            </p>
            <Link to="/">
              <Button>Voltar para a página inicial</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const finalPrice = product.discount
    ? product.price - (product.price * product.discount / 100)
    : product.price;

  const stockStatus = product.stock > 0
    ? product.stock <= 5
      ? `Apenas ${product.stock} em estoque`
      : "Em estoque"
    : "Fora de estoque";

  const stockColor = product.stock > 5
    ? "text-green-600"
    : product.stock > 0
      ? "text-yellow-600"
      : "text-red-600";

  const displayProductColors = (product.colors && product.colors.length > 0)
    ? product.colors
    : DEFAULT_PRODUCT_COLORS;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar para produtos
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg overflow-hidden border">
              <img
                src={product.imageUrl || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-auto object-cover aspect-square"
              />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CategoryBadge category={product.category} />
                  {product.discount ? (
                    <span className="bg-red-500 text-white px-2 py-0.5 text-xs font-medium rounded">
                      -{product.discount}% OFF
                    </span>
                  ) : null}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center">
                    <span className={`flex items-center gap-1 text-sm font-medium ${stockColor}`}>
                      {product.stock > 0 ? <Check className="h-4 w-4" /> : null}
                      {stockStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  {product.discount ? (
                    <>
                      <span className="text-muted-foreground line-through text-lg">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <span className="text-3xl font-bold text-primary">
                        R$ {finalPrice.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      R$ {finalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Em até 12x de R$ {(finalPrice / 12).toFixed(2)} sem juros
                </p>
              </div>
              <Separator />

              {product.allowCustomization && (
                <div className="space-y-4">
                  <h3 className="font-medium">Personalização</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="customName">Nome a ser gravado</Label>
                      <Input
                        id="customName"
                        placeholder="Ex: João Silva"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="customModality">Modalidade</Label>
                      <Input
                        id="customModality"
                        placeholder="Ex: Atletismo"
                        value={customModality}
                        onChange={(e) => setCustomModality(e.target.value)}
                      />
                    </div>

                    {displayProductColors.length > 0 && (
                      <div className="space-y-2">
                        <Label>Cor</Label>
                        <div className="flex items-center gap-3 flex-wrap">
                          {displayProductColors.map((colorValue) => {
                            const colorName = AVAILABLE_COLORS_MAP[colorValue.toUpperCase()] || AVAILABLE_COLORS_MAP[colorValue.toLowerCase()] || colorValue;
                            return (
                              <button
                                key={colorValue}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === colorValue ? 'border-foreground ring-2 ring-offset-2 ring-primary scale-110' : 'border-gray-300 hover:border-gray-400'}`}
                                style={{ backgroundColor: colorValue, borderColor: colorValue === '#000000' && selectedColor !== '#000000' ? '#333' : undefined }}
                                onClick={() => setSelectedColor(colorValue)}
                                title={colorName}
                                aria-label={`Selecionar cor ${colorName}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <Separator />
                </div>
              )}

              {product.stock > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}>-</Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= product.stock}>+</Button>
                    <span className="text-sm text-muted-foreground ml-2">{product.stock} disponíveis</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button className="w-full gap-2" onClick={handleAddToCartInternal}><ShoppingCart className="h-4 w-4" />Adicionar ao Carrinho</Button>
                    <Link to="/carrinho" className="w-full">
                      <Button variant="secondary" className="w-full" onClick={handleAddToCartInternal}>Comprar Agora</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <Button disabled className="w-full">Produto Indisponível</Button>
              )}

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium">Formas de entrega:</p>
                <ul className="mt-2 space-y-1">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Envio para todo Brasil</span></li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Frete grátis para compras acima de R$300</span></li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><span>Garantia de 30 dias</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-12 mb-12">
            <section>
              <h2 className="text-xl font-bold mb-6 pb-2 border-b">Descrição</h2>
              <div className="text-muted-foreground">
                <div className="prose max-w-none dark:prose-invert">
                  {product.description.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                  {product.descriptionImages && product.descriptionImages.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {product.descriptionImages.map((img, index) => (
                        <img key={index} src={img} alt={`${product.name} - imagem descritiva ${index + 1}`} className="rounded-md w-full h-auto object-cover"/>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-6 pb-2 border-b">Especificações</h2>
              <div className="space-y-4">
                {/* MODIFICADO: Verifica se existem especificações dinâmicas e as renderiza */}
                {product.specifications && product.specifications.length > 0 && product.specifications.some(spec => spec.name && spec.value) ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-base">Detalhes Técnicos</h4>
                    <ul className="space-y-2 text-sm">
                      {product.specifications.map((spec, index) => (
                        // Renderiza apenas se nome e valor da especificação existirem
                        spec.name && spec.value && (
                          <li key={index} className="flex justify-between gap-2">
                            <span className="text-muted-foreground whitespace-nowrap">{spec.name}:</span>
                            <span className="font-medium text-right">{spec.value}</span>
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                ) : (
                  // Mensagem caso não haja especificações técnicas dinâmicas ou estejam vazias
                  <div className="bg-muted/50 p-4 rounded-lg">
                     <p className="text-sm text-muted-foreground">Nenhuma especificação técnica detalhada fornecida para este produto.</p>
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 text-base">Outras Informações</h4>
                    <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                            <span className="text-muted-foreground">Categoria:</span>
                            <span className="font-medium">{getCategoryLabel(product.category)}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-muted-foreground">Estoque Atual:</span>
                            <span className="font-medium">{product.stock} unidades</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-muted-foreground">Código:</span>
                            <span className="font-medium">PROD-{product.id.substring(0, 8).toUpperCase()}</span>
                        </li>
                         <li className="flex justify-between">
                            <span className="text-muted-foreground">Garantia:</span>
                            <span className="font-medium">30 dias</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-muted-foreground">Origem:</span>
                            <span className="font-medium">Brasil</span>
                        </li>
                    </ul>
                </div>

                {product.specificationImages && product.specificationImages.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3 text-base">Imagens Detalhadas</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {product.specificationImages.map((img, index) => (
                        <img key={index} src={img} alt={`${product.name} - especificação ${index + 1}`} className="rounded-md w-full h-auto object-cover border"/>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-6 pb-2 border-b">Entrega</h2>
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-base">Informações de Entrega</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" /><span>Envio para todo o Brasil através dos Correios ou transportadoras parceiras.</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" /><span>Prazo de envio: 1-3 dias úteis após a confirmação do pagamento.</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" /><span>Frete grátis para compras acima de R$300,00 (consulte regiões).</span></li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-base">Condições de Troca e Devolução</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" /><span>Você tem até 7 dias após o recebimento para solicitar a troca ou devolução do produto.</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" /><span>O produto deve estar em perfeitas condições, na embalagem original e com todos os acessórios.</span></li>
                  </ul>
                </div>
                {product.deliveryImages && product.deliveryImages.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3 text-base">Imagens de Embalagem/Envio</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {product.deliveryImages.map((img, index) => (
                        <img key={index} src={img} alt={`${product.name} - entrega ${index + 1}`} className="rounded-md w-full h-auto object-cover border"/>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {relatedProducts.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-6">Produtos Relacionados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {relatedProducts.map((relProduct) => (
                  <Link key={relProduct.id} to={`/produto/${relProduct.id}`} className="group">
                    <Card className="overflow-hidden hover-scale h-full flex flex-col">
                      <div className="h-44 bg-muted flex-shrink-0">
                        <img src={relProduct.imageUrl || "/placeholder.svg"} alt={relProduct.name} className="h-full w-full object-cover transition-all group-hover:scale-105"/>
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <h4 className="font-medium line-clamp-2 flex-grow">{relProduct.name}</h4>
                        <div className="mt-2">
                          {relProduct.discount ? (
                            <div className="flex flex-col">
                              <span className="text-muted-foreground line-through text-sm">R$ {relProduct.price.toFixed(2)}</span>
                              <span className="text-lg font-bold text-primary">R$ {(relProduct.price - (relProduct.price * (relProduct.discount || 0) / 100)).toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-primary">R$ {relProduct.price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <footer className="bg-sport-dark text-white py-8">
        <div className="container px-4 md:px-6 text-center">
          <p>&copy; {new Date().getFullYear()} Oficina do Corte. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "porta-medalhas": return "Porta Medalhas";
    case "trofeus": case "trophies": return "Troféus";
    case "medalhas": return "Medalhas";
    default: return category.charAt(0).toUpperCase() + category.slice(1);
  }
}

function CategoryBadge({ category }: { category: string }) {
  let icon;
  let label = "";
  let classes = "";
  switch (category) {
    case "porta-medalhas":
      icon = <Medal className="h-3 w-3" />;
      label = "Porta Medalhas";
      classes = "bg-sport-gold/20 text-sport-gold";
      break;
    case "trofeus": case "trophies":
      icon = <Trophy className="h-3 w-3" />;
      label = "Troféus";
      classes = "bg-sport-blue/20 text-sport-blue";
      break;
    default:
      icon = <Medal className="h-3 w-3" />;
      label = getCategoryLabel(category);
      classes = "bg-muted text-muted-foreground";
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {icon} {label}
    </span>
  );
}