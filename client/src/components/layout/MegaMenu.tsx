import * as React from "react"
import { cn } from "@/lib/utils"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Calculator, BarChart3, MessageSquare, Shield, Wallet, BookOpen, Users, Package } from "lucide-react"
import { useLocation } from "wouter"

const components: { title: string; href: string; description: string; icon: any }[] = [
    {
        title: "Calculadora de Lucro",
        href: "/funcionalidades/calculadora-mercado-livre",
        description: "Simule seus ganhos reais descontando todas as taxas e impostos.",
        icon: Calculator
    },
    {
        title: "Gestão de Pedidos",
        href: "/funcionalidades/gestao-pedidos",
        description: "Centralize vendas do ML, Shopee e Amazon em um único painel.",
        icon: Package
    },
    {
        title: "Conciliação Financeira",
        href: "/funcionalidades/conciliacao-financeira",
        description: "Bata cada centavo recebido com o esperado. Chega de furos.",
        icon: Wallet
    },
    {
        title: "Dashboard de Vendas",
        href: "/funcionalidades/dashboard-vendas",
        description: "Métricas de conversão, ticket médio e produtos mais rentáveis.",
        icon: BarChart3
    },
]

const resources: { title: string; href: string; description: string; icon: any }[] = [
    {
        title: "Blog",
        href: "/blog",
        description: "Dicas de e-commerce e atualizações do mercado.",
        icon: BookOpen
    },
    {
        title: "Casos de Sucesso",
        href: "/cases",
        description: "Veja como outros sellers escalaram suas operações.",
        icon: Users
    },
    {
        title: "Central de Ajuda",
        href: "/ajuda",
        description: "Tutoriais passo-a-passo e suporte técnico.",
        icon: MessageSquare
    },
]

export function MegaMenu() {
    const [, setLocation] = useLocation();

    return (
        <NavigationMenu>
            <NavigationMenuList>

                {/* Funcionalidades */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-zinc-100 text-zinc-600">Funcionalidades</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white">
                            {components.map((component) => (
                                <ListItem
                                    key={component.title}
                                    title={component.title}
                                    href={component.href}
                                    icon={component.icon}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setLocation(component.href);
                                    }}
                                >
                                    {component.description}
                                </ListItem>
                            ))}
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Soluções */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-zinc-100 text-zinc-600">Soluções</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-white">
                            <li className="row-span-3">
                                <NavigationMenuLink asChild>
                                    <a
                                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-purple-600 to-indigo-700 p-6 no-underline outline-none focus:shadow-md"
                                        href="/"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setLocation("/");
                                        }}
                                    >
                                        <Shield className="h-6 w-6 text-white" />
                                        <div className="mb-2 mt-4 text-lg font-medium text-white">
                                            Markthub Enterprise
                                        </div>
                                        <p className="text-sm leading-tight text-white/90">
                                            Para operações que faturam acima de R$ 100k/mês. Consultoria dedicada e API personalizada.
                                        </p>
                                    </a>
                                </NavigationMenuLink>
                            </li>
                            <ListItem href="/solucoes/iniciantes" title="Para Iniciantes" onClick={() => setLocation('/solucoes/iniciantes')}>
                                Saia do zero e faça suas primeiras 100 vendas.
                            </ListItem>
                            <ListItem href="/solucoes/mercado-lider" title="Para MercadoLíder" onClick={() => setLocation('/solucoes/mercado-lider')}>
                                Automatize sua rotina e aumente sua margem.
                            </ListItem>
                            <ListItem href="/solucoes/agencias" title="Para Agências" onClick={() => setLocation('/solucoes/agencias')}>
                                Gerencie múltiplas contas de clientes.
                            </ListItem>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Recursos */}
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-zinc-100 text-zinc-600">Recursos</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white">
                            {resources.map((component) => (
                                <ListItem
                                    key={component.title}
                                    title={component.title}
                                    href={component.href}
                                    icon={component.icon}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setLocation(component.href);
                                    }}
                                >
                                    {component.description}
                                </ListItem>
                            ))}
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <a href="#pricing" className={navigationMenuTriggerStyle() + " bg-transparent hover:bg-zinc-100 text-zinc-600 cursor-pointer"}>
                        Planos
                    </a>
                </NavigationMenuItem>

            </NavigationMenuList>
        </NavigationMenu>
    )
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { icon?: any }
>(({ className, title, children, icon: Icon, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-zinc-100 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="flex items-center gap-2 text-sm font-medium leading-none text-zinc-900">
                        {Icon && <Icon className="h-4 w-4 text-purple-600" />}
                        {title}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-zinc-500 mt-1.5">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
